from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
import io
import urllib.parse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🔑 API 金鑰與網址設定
# ==========================================
API_KEY = "dk-2cf0beba0b69c12e1b242821d6567d40" # 繪圖專用 
COPY_API_KEY = "dk-ca97785202cc7c803b16b8b879a3e4d3" # 文案與標題專用

# 🌟 已更新為 GPT-Image-2 專用生成端點
GENERATE_URL = "https://api.defapi.org/api/gpt-image/gen"
CHAT_URL = "https://api.defapi.org/v1/chat/completions"

# ==========================================
# 📦 資料模型
# ==========================================
class HeroGenerateRequest(BaseModel):
    product_images: List[str]
    subject_images: List[str]
    category: str
    detail_pos: str
    detail_1: str
    detail_2: str
    detail_3: str
    title_1: str
    title_2: str
    font_type: str
    font_layout: str
    sp_1: str
    sp_2: str
    sp_3: str
    logo_image: Optional[str] = ""
    title_effects: List[str] = []
    custom_prompt: str = ""           

class InnerGenerateRequest(BaseModel):
    subject_images: List[str]
    reference_images: List[str]    
    category: str
    scenario_prompt: str           
    custom_prompt: str             

class CopyGenerateRequest(BaseModel):
    images: List[str]              
    product_name: str
    selling_points: str
    custom_prompt: str

class TitleGenerateRequest(BaseModel):
    main_keyword: str
    marketing_words: str
    product_specs: str
    category_words: str

# ==========================================
# 🧠 大腦 1：首圖專屬通道 (已升級 GPT-Image-2)
# ==========================================
@app.post("/api/generate/hero")
async def generate_hero(req: HeroGenerateRequest):
    all_images = req.subject_images + req.product_images
    if req.logo_image:
        all_images.append(req.logo_image)

    title_text = f"【主標題】：{req.title_1}"
    if req.title_2:
        title_text += f" \\n【副標題】：{req.title_2}"

    sp_list = list(filter(None, [req.sp_1, req.sp_2, req.sp_3]))
    sp_instruction = "、".join(sp_list) if sp_list else "請只根據商品圖片中可明確辨識的特徵，提取 2-3 個核心優勢作為賣點標籤，不可亂編"

    dt_list = list(filter(None, [req.detail_1, req.detail_2, req.detail_3]))
    if dt_list:
        dt_instruction = f"在畫面的【{req.detail_pos}】繪製質感圓框，展示商品圖中真實存在且可清楚辨識的局部細節：{'、'.join(dt_list)}。下方強制加繁體中文標籤。"
    else:
        dt_instruction = f"在【{req.detail_pos}】設計 2-3 個質感圓形特寫鏡頭，但特寫內容只能來自商品圖片中真實存在的局部細節，並在正下方加上繁體中文解說短語。"

    title_effects_map = {
        "閃光星星": "主標題與副標題文字周圍加入少量閃爍星星與光點裝飾，用來襯托標題字。",
        "泡泡水滴": "主標題與副標題文字周圍加入少量透明泡泡與晶瑩水滴裝飾，用來襯托標題字。",
        "花草葉片": "主標題與副標題文字周圍加入少量綠色葉片、小花朵與藤蔓裝飾，用來襯托標題字。",
        "火焰光效": "主標題與副標題文字周圍加入少量火焰、暖色光暈與火花效果，用來襯托標題字。"
    }

    mapped_title_effects = [title_effects_map.get(x, x) for x in req.title_effects]
    title_effects_text = "、".join(mapped_title_effects) if mapped_title_effects else "無"

    system_prompt = f"""
# Role & Core Mission:
你是全球頂尖的電商視覺設計師與轉化率專家。
你的任務不是重新設計商品，而是「以用戶上傳的商品主體圖 [subject_images] 為唯一真值來源」，在 100% 保留商品本體外觀的前提下，製作高轉化率的電商首圖。

# Image Role Definition (最高優先級鐵律):
1. [subject_images] = 商品主體圖 / 唯一真值來源 / 商品本體唯一依據。必須保留商品的外輪廓、比例、材質、顏色、透明度、反光質感、結構與所有真實存在的零件細節。
2. [product_images] = 同款商品的補充角度圖、局部細節圖、輔助展示圖；若與 subject_images 衝突，一律以 subject_images 為準。
3. [logo_image] = 僅供畫面中的品牌浮水印、角落品牌識別、輕量 Logo 點綴使用。若有提供 [logo_image]，可將其自然放置於畫面角落、留白區、邊框附近或不影響主體辨識的位置，作為品牌露出元素。不得將其視為商品本體的一部分，不得用來重做商品包裝、改寫商品標籤、替換商品本體上的原始印刷內容，也不得因加入 logo_image 而改變商品外觀、材質、比例、結構或包裝版型。
4. 若多張圖片之間有任何衝突，一律優先服從 subject_images。

# Absolute Requirements:
1. 分類一致性：背景氛圍必須 100% 符合【{req.category}】的市場審美。
2. 字體風格規則：
    - 若使用者明確指定【{req.font_type}】與【{req.font_layout}】，請優先依照指定執行。
    - 標題呈現風格必須與商品調性一致。
    - 可愛、親切、小物、兒童感商品，優先考慮圓潤、活潑、輕鬆的字體與跳動感排版。
    - 精緻、高端、玻璃器皿、香氛、美妝、質感家居商品，優先考慮典雅、乾淨、精修感較強的字體與穩定排版。
    - 科技、五金、工具、機能型商品，優先考慮俐落、厚實、幾何感、力量感較強的字體與有秩序的排版。
    - 溫馨、自然、生活感、居家感商品，優先考慮柔和、溫暖、親切的字體與自然舒適的排版。
    - 時尚、促銷感強、年輕化商品，優先考慮視覺張力高、較有設計感與吸睛效果的字體與排版。
    - 若商品本身具有文化感、東方感、傳統感，可適度使用較有文化氣質的字體與直排或特色排版。
    - 無論選擇哪一種風格，標題都必須維持高辨識度、高可讀性、高商業感，不能因為造型過強而難閱讀。
    - 標題字必須是主視覺的一部分，不可只是單純壓字排版。
    - 請把標題視為「商品海報主視覺物件」來設計，而不是普通資訊文字。
    - 只能使用繁體中文。
3. 主體佔比（極度重要）：商品主體必須充滿視覺張力，至少佔據畫面的 60% 到 70% 面積，絕不可縮小或退成遠景。
4. 商品保真（最高優先級）：必須完整保留商品的外輪廓、比例、材質、顏色、透明度、反光質感、細節結構與零件數量。不得改變商品本體造型、材質表現與真實結構。
5. 嚴禁任何形式的商品重生成、變形、腦補、升級、改版、美化後重畫。
6. 比例強制 1:1，4K 高清商業級渲染。

# Title Decoration Rule:
【標題字專屬裝飾效果】
{title_effects_text}

- 上述效果若有啟用，只能附著在主標題與副標題文字的外圍輪廓、字旁留白區、標題字周圍的小範圍區域，用來襯托標題字本身。
- 這些裝飾不得擴散到整體背景、不得漂浮於商品主體周圍、不得進入細節圓框、不得覆蓋賣點標籤、不得作為全圖氛圍裝飾。
- 這些裝飾必須是局部、少量、克制、附屬性的，不能成為畫面主體。
- 若未啟用任何標題字專屬裝飾效果，則不要自行加入星星、泡泡、水滴、葉片、火焰或類似裝飾。

# Content Instructions:
- 文字內容：{title_text}
- 賣點展現：請將「{sp_instruction}」設計為立體懸浮標籤，但內容只能來自圖片中可明確辨識的特徵或使用者已提供的明確資訊，不可自行補充功能。
- 視覺特寫：{dt_instruction}
- 構圖要求：進行高轉化率首圖排版，確保文字高對比、易讀且不遮擋商品關鍵特徵。
- 請把標題文字字體視為「商品海報主視覺物件」來設計，而不是普通資訊文字。
- 只允許改背景、光影、排版、文案區塊與裝飾性視覺元素，不可改變商品本體。

# Negative Instructions (強制禁止事項):
(deformed product:1.5), (modified structure:1.5), wrong branding, wrong logo text, text rendering errors, regenerated product, hallucinated details, added parts, changed material, changed color, changed transparency, surreal, low quality, blurry product, duplicate product, extra accessories, distorted shape, background bubbles, floating bubbles across full scene, bubble decoration around product, bubbles inside detail circles, full-scene water droplet effect, global decorative particles, stars across full background, leaves across full background, flames across full background, decorative effects around product body.

# Final Execution Rule:
若「首圖更吸睛」與「商品真實外觀」發生衝突，
一律優先保留商品真實外觀。
你的任務是提升首圖轉化率，不是把商品變成別的樣子。

{f'自訂要求：{req.custom_prompt}' if req.custom_prompt else ''}
"""

    # 🌟 已更新為 GPT-Image-2 專用模型名稱
    payload = {
        "model": "openai/gpt-image-2",
        "prompt": system_prompt,
        "images": all_images,
        "aspect_ratio": "1:1",
        "ratio": "1:1"
    }

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    response = requests.post(GENERATE_URL, headers=headers, json=payload)

    if response.status_code == 200:
        result = response.json()
        task_id = result.get("data", {}).get("task_id") or result.get("taskId")
        if task_id:
            return {"status": "processing", "task_id": task_id}
        else:
            raise HTTPException(status_code=500, detail=f"API 異常: {result}")
    else:
        raise HTTPException(status_code=response.status_code, detail=f"API 拒絕: {response.text}")


# ==========================================
# 🧠 大腦 2：內文圖專屬通道 (已升級 GPT-Image-2)
# ==========================================
@app.post("/api/generate/inner")
async def generate_inner(req: InnerGenerateRequest):
    all_images = req.subject_images + req.reference_images
    
    system_prompt = f"""
# Role & Core Mission:
你是台灣蝦皮頂尖電商視覺藝術指導與金牌行銷企劃。你的任務是「以用戶上傳的商品主體圖 [subject_images] 為絕對真值來源」，在 100% 不改變商品本體外觀的前提下，完成具備「強大視覺張力與精準賣點提煉」的高轉化率 4K 內文圖。

# Image Role Definition (最高優先級鐵律):
1. [subject_images] = 唯一真值來源。必須完美保留商品的外輪廓、比例、材質、反光質感、顏色、結構與細節。
2. [reference_images] = 僅供參考「背景氛圍、光影、排版骨架」。絕對嚴禁將參考圖中的商品外觀、配件或裝飾套用到最終生成圖上。
3. 衝突解決：若排版需求與商品真實外觀衝突，無條件優先保留 [subject_images] 的真實樣貌。

# Task & Execution (高轉化排版與光影):
- 進行無損去背與完美光影融合，只改變背景與版面配置。
- 視覺風格鎖定：背景與光影氛圍必須完美契合【{req.category}】的電商市場最高標準審美。
- 畫面比例強制 1:1，呈現商業級電商詳情圖的 4K 質感。
- 確保商品佔據視覺焦點（畫面佔比 >60%），清晰可辨，不可退成模糊遠景。
- 嚴禁 AI 幻覺：看不清楚的細節寧可保留原樣，絕對不可自行發明不存在的按鍵、裝飾或孔洞。

# Marketing & Typography (核心賣點渲染 - 點擊率關鍵):
- 必須主動分析【專屬排版骨架】與【產品資訊補充】中的內容，將「核心賣點與優勢」轉化為極具吸引力的視覺文案排版（例如：質感大標題、功能特點標籤、痛點對比字體）。
- 賣點文案必須排版專業、層次分明，精準切中消費者痛點，引發共鳴並引導購買決策。
- 所有畫面中的文字必須為自然、正確、無錯字的「繁體中文」。
- 文字區塊必須與畫面完美融合，且「絕對不可遮擋商品本體的關鍵特徵」。

# Negative Instructions (強制禁止事項 - AI 繪圖權重鎖定):
(deformed product:1.5), (modified structure:1.5), wrong materials, added parts, hallucinated details, surreal, low quality, wrong branding, text rendering errors, (changing subject item:1.5), (blurry product:1.2).

# 專屬排版骨架 (Scenario):
{req.scenario_prompt}

# 產品資訊補充 (Custom Details):
{req.custom_prompt}
"""

    # 🌟 已更新為 GPT-Image-2 專用模型名稱
    payload = {
        "model": "openai/gpt-image-2",
        "prompt": system_prompt,
        "images": all_images,
        "aspect_ratio": "1:1",
        "ratio": "1:1"
    }
    
    headers = { "Accept": "application/json", "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}" }
    response = requests.post(GENERATE_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        task_id = result.get("data", {}).get("task_id") or result.get("taskId")
        if task_id: return {"status": "processing", "task_id": task_id}
        else: raise HTTPException(status_code=500, detail=f"API 異常: {result}")
    else:
        raise HTTPException(status_code=response.status_code, detail=f"API 拒絕: {response.text}")


# ==========================================
# 🧠 大腦 3：爆款文案生成通道 
# ==========================================
@app.post("/api/generate/copy")
async def generate_copy(req: CopyGenerateRequest):
    system_prompt = """你是「台灣蝦皮電商商品文案生成專家」，同時具備以下能力：

1. 商品圖像判讀專家
能根據我提供的商品圖片，自動判斷商品類型、用途、材質感、使用情境、目標客群、外觀亮點、可能解決的生活問題。
若圖片資訊不足，不可亂編，必須只根據可辨識內容撰寫，並以保守方式表達。

2. 台灣電商顧客心理文案專家
你非常熟悉台灣蝦皮買家的閱讀習慣，知道消費者在意的是：
- 這是什麼
- 有什麼用
- 能幫我解決什麼麻煩
- 跟其他商品比有什麼更值得買
- 用起來是否方便、實用、好看、省事、省空間、省時間
- 是否適合我現在的使用情境

3. 在地化語言專家
請使用台灣在地化、自然、口語、親切、有溫度的繁體中文。
語氣像有經驗的台灣賣家，不要像機器，不要像廣告公司，不要像論文。
避免中國用語、過度誇張、空泛形容、過度正式、過多贅字。

4. 精華提煉專家
文案必須精準、有重點、不冗長。
不要長篇大論，不要一直重複同一件事。
要把最有感、最能促進下單的資訊優先寫出來。

5. 文案策略專家
請根據圖片內容，自動完成以下分析與寫作：
- 判斷商品名稱
- 判斷商品主要用途
- 判斷顧客可能痛點
- 判斷商品核心賣點
- 提供有感且具體的形容詞
- 提供明確自然的行動呼籲（CTA）
- 用顧客看得懂、會有感的方式寫文案

【你的工作流程】
請嚴格依照以下順序在心裡「默默思考」，**但絕對不要把思考過程印出來**：
第一步：看圖辨識
先根據圖片判斷：商品可能是什麼、適合什麼使用情境、外觀或設計上最吸引人的地方是什麼、使用者最可能在什麼需求下購買它。
第二步：抓顧客痛點
從消費者角度思考：沒有這個商品時，生活中可能有哪些麻煩、現有替代品可能有哪些不方便、消費者會在意哪些問題（收納、清潔、效率、美觀、耐用、方便、安全、舒適、安裝簡單、省空間、省時間等）。
第三步：整理商品賣點
請只寫圖片中合理可推知、且對下單有幫助的賣點。賣點要具體，不要空泛。例如不要只寫「高品質」，要改成更具體的說法，如：厚實穩固、一掛就順手、不占空間、看起來更整齊、日常拿取更方便、清爽俐落、小空間也好利用、視覺更簡潔、擺著也好看。
第四步：用字優化
形容詞必須是「有畫面感、顧客有感、能幫助成交」的詞。避免空泛詞，例如：高端、完美、頂級、極致、超神、黑科技。改用具體、有感、生活化的詞，例如：清爽、俐落、順手、穩固、省空間、耐看、貼心、實用、好整理、好拿取、不突兀、日常超方便。

【輸出格式與規則】⚠️ 這是絕對命令
你只需要、也只能輸出「第五步：寫文案」與「CTA」的最終結果。
1. 絕對不要印出「第一步」、「商品判讀」、「顧客痛點分析」、「商品賣點整理」、「建議使用的具體形容詞」等字樣或其內容。
2. 絕對不要使用 Markdown 的標題符號 (例如 ### 1.、### 2.)。
3. 直接輸出一段排版乾淨、重點明確、適合直接貼上蝦皮商品描述的精簡文案。
4. 可以搭配少量且適當的 emoji (如 ✨、🔥、👉 等)，但不要過度使用。
5. 文案結尾請自然地附上 3 句不同的 CTA (行動呼籲)。

【文案撰寫重點】
- 開頭要先讓顧客快速知道商品是什麼、值不值得看
- 中段快速點出痛點與賣點
- 文字要短，不拖泥帶水
- 不可過度誇大
- 要有明確但自然的 CTA
- 整體要像真人賣家寫的，不要有 AI 味
- 不能寫得像品牌形象廣告
- 要偏「好懂、好讀、好下單」

請特別注意：不要空泛文案，我要的是「看到就想買、看了就知道用途」的文字。若圖片無法明確判斷的資訊，請不要自行補充，避免亂編。請不要只列商品特色，請把特色轉成顧客會有感的使用價值。每段以短句為主，避免長篇大論。請優先寫出：顧客一看就懂的用途、顧客當下會有感的麻煩、商品如何讓生活更方便、具體使用後的感受、會讓人想下單的關鍵一句話。不要一直講虛的好處，要多講「實際感受」。例如：「免打孔設計」要改寫成「不用鑽牆，安裝更省事」；「大容量設計」要改寫成「瓶瓶罐罐一起放也不會亂」。請讓每一句話都更像台灣蝦皮上會成交的說法。"""

    user_message = f"【商品名稱】：{req.product_name}\n"
    if req.selling_points: user_message += f"【我想強調的核心賣點】：{req.selling_points}\n"
    if req.custom_prompt: user_message += f"【特別備註/補充說明】：{req.custom_prompt}\n"
    user_message += "請根據我上傳的圖片與上述資訊，為我撰寫可以直接貼上蝦皮的高轉化文案。請記住，只輸出最終文案內容，不要輸出任何分析過程與標題符號。"

    content_list = [{"type": "text", "text": user_message}]
    for img_b64 in req.images:
        content_list.append({"type": "image_url", "image_url": {"url": img_b64}})

    payload = {
        "model": "google/gemini-3-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content_list}
        ]
    }
    
    headers = { "Accept": "application/json", "Content-Type": "application/json", "Authorization": f"Bearer {COPY_API_KEY}" }
    response = requests.post(CHAT_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        ai_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        footer_text = """
▪️ - ▪️ - ▪️ - ▪️ - ▪️ - ▪️ - ▪️ - ▪️- ▪️ - ▪️ - ▪️
🔸 台灣公司台灣出貨 🔸
🔸 出貨資訊顯示" 訂單處理中 "表示已出貨 🔸
【 📣 購買前須知】
．若為急件，可先詢問客服有無現貨唷~
．下單前請務必再次確認您選購的規格、尺寸、顏色、款式..等等，
確認無誤後再進行下單，避免造成您後續換貨上的困擾唷。
．若為急件或者大量訂購及其他問題可先洽詢聊聊，客服人員會盡快為您服務。
【 📦 退換貨問題】
．商品皆有鑑賞期，購買安心有保障
．「猶豫期」非「試用期」，在您還不確定是否要辦理退貨以前，請勿拆封、使用
．一經拆封、使用後則依消費者保護法之規定，無法享有七天猶豫期之權益且不得辦理退貨。
．商品只要直接有瑕疵 / 寄錯 / 其他問題，請在第一時間告知我們，我們會盡快為您安排換貨。
【 🚛 出貨須知】 
．超商取貨付款：出貨後約2~3天到門市 
．宅配：都會區出貨後約1~2天到(不含六、日),偏遠地區到貨時間會延長
✌ 感謝大家的支持，我們會更加進步的 ✌
💖 喜歡我們商品與服務，歡迎給我們滿滿 ★★★★★ 顆星哦!"""

        final_copy = ai_text.strip() + "\n\n" + footer_text.strip()
        return {"status": "success", "data": final_copy}
    else:
        raise HTTPException(status_code=response.status_code, detail=f"文案 API 拒絕: {response.text}")


# ==========================================
# 🧠 大腦 4：演算法點擊率標題引擎 
# ==========================================
@app.post("/api/generate/title")
async def generate_title(req: TitleGenerateRequest):
    system_prompt = f"""
    你是台灣蝦皮頂尖 SEO 演算法專家。你深知蝦皮的「逛、查、分、測」邏輯。
    
    現在，賣家提供了一個已經確認【搜尋量 > 7000】的核心主詞：「{req.main_keyword}」。
    請利用你的演算法知識，根據賣家提供的屬性，延伸出高關聯性的「主二」、「主三」、「搜索詞」與「規格詞」。

    請務必依照以下兩種演算法公式，為賣家產出高點擊率的商品標題（請各產出 3 組，總共 6 組標題）：

    【方法 A：新版無腦塞滿流】
    公式：【行銷詞】隔日配 主關鍵字 主二 主三 (盡量控制在5組關鍵字，如果不夠再補上搜索詞或規格詞)
    說明：括號【】裡的詞吃不到搜尋流量，純粹用來吸引眼球點擊，行銷詞必須依照商品名稱來思考適合的吸睛詞彙。
    
    【方法 B：舊版穩紮穩打流】
    公式：主1 類目詞1 主2 規格詞 主3 搜索詞
    
    【輸出要求】：
    請直接給出 6 組標題結果，不要廢話，不要解釋你的思考過程，也不要生成文案，排版清晰易讀即可。
    """

    user_message = f"行銷詞參考：{req.marketing_words}\n類目詞參考：{req.category_words}\n產品規格參考：{req.product_specs}\n請開始生成標題！"

    payload = {
        "model": "google/gemini-3-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }
    
    headers = { "Accept": "application/json", "Content-Type": "application/json", "Authorization": f"Bearer {COPY_API_KEY}" }
    response = requests.post(CHAT_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        ai_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"status": "success", "data": ai_text.strip()}
    else:
        raise HTTPException(status_code=response.status_code, detail=f"標題 API 拒絕: {response.text}")


# ==========================================
# 狀態查詢與代理下載 (修復：支援前端自訂檔名下載)
# ==========================================
@app.get("/api/status/{task_id}")
async def check_status(task_id: str):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    query_url = f"https://api.defapi.org/api/task/query?task_id={task_id}"
    res = requests.get(query_url, headers=headers).json()
    if res.get("statusCode") == 404 or res.get("error"):
        return {"status": "failed", "detail": f"查詢失敗: {res.get('message')}"}
    data_block = res.get("data") if isinstance(res.get("data"), dict) else {}
    if isinstance(res.get("data"), list) and len(res.get("data")) > 0:
        data_block = res.get("data")[0]
    status = str(data_block.get("status") or res.get("status") or "").upper()
    
    if status in ["SUCCESS", "SUCCEEDED", "COMPLETED", "FINISHED", "DONE"]:
        image_url = None
        if "result" in data_block and isinstance(data_block["result"], list) and len(data_block["result"]) > 0:
            item = data_block["result"][0]
            image_url = item.get("image") if isinstance(item, dict) else None
        if not image_url:
            image_url = data_block.get("image_url") or data_block.get("imageUrl") or data_block.get("image")
        if image_url: return {"status": "completed", "image_url": image_url}
        else: return {"status": "failed", "detail": "任務成功但未找到圖片 URL"}
            
    elif status in ["FAILED", "ERROR", "FAIL"]: return {"status": "failed", "detail": "AI 生成出錯"}
    else: return {"status": "processing"}

@app.get("/api/download_proxy")
async def proxy_download_image(url: str, filename: str = "SaaS_Image.jpg"):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        img_res = requests.get(url, headers=headers)
        if img_res.status_code == 200:
            # 支援繁體中文的 URL Encode 檔名
            encoded_filename = urllib.parse.quote(filename)
            return StreamingResponse(
                io.BytesIO(img_res.content), media_type="image/jpeg", 
                headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
            )
        else: raise HTTPException(status_code=400, detail="無法取得原始圖片")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/style.css")
async def serve_css(): return FileResponse("style.css")
@app.get("/app.js")
async def serve_js(): return FileResponse("app.js")
@app.get("/")
async def serve_frontend(): return FileResponse("index.html")