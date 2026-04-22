const API_BASE_URL = ""; 
let currentImageUrl = ""; 

function switchTab(tabId, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
    element.classList.add('active');
    const targetTab = document.getElementById(tabId);
    targetTab.style.display = (tabId === 'tab-hero' || tabId === 'tab-inner' || tabId === 'tab-copy' || tabId === 'tab-title') ? 'flex' : 'block';
    if(tabId === 'tab-history') { renderHistory(); }
}

function selectRadioTag(groupClass, clickedBtn) {
    document.querySelectorAll(`.${groupClass}`).forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
}

const promptDictionary = {
    "現實圖": "細節圓框內容使用高畫質現實照片風格，如同實拍特寫照片",
    "純線條圖": "細節圓框內容使用純線條圖風格，簡潔的黑白或單色線條插畫",
    "卡通圖": "細節圓框內容使用可愛卡通插畫風格。注意：僅限細節裝飾可使用卡通，產品本體必須維持真實照片質感",
    "圖示風格": "細節圓框內容使用扁平化圖示風格，簡約向量圖形",
    "閃光星星": "【重要裝飾】標題字加入閃爍的星星與光點裝飾，營造亮眼精緻感。用來襯托標題字。禁止將星星與光點擴散到整體背景、商品主體、細節圓框或整張圖其他區域。",
    "泡泡水滴": "【重要裝飾】標題字加入透明泡泡與晶瑩水滴裝飾，營造清潔清爽感用來襯托標題字。禁止將泡泡水滴擴散到整體背景、商品主體、細節圓框或整張圖其他區域。",
    "花草葉片": "【重要裝飾】標題字加入綠色葉片、小花朵與藤蔓裝飾，營造自然清新感。用來襯托標題字。禁止將花草葉片擴散到整體背景、商品主體、細節圓框或整張圖其他區域。",
    "火焰光效": "【重要裝飾】標題字加入火焰、暖色光暈與火花效果，營造溫暖熱情感。用來襯托標題字。禁止將火焰光效擴散到整體背景、商品主體、細節圓框或整張圖其他區域。",
    "棚拍質感": "高級電商棚拍質感，專業柔光箱打光，背景乾淨純色",
    "生活場景": "產品置於真實生活場景中，增加代入感",
    "科技感": "科技風格背景，加入光線、粒子或幾何元素",
    "自然溫暖": "暖色自然光，溫馨居家氛圍",
    "折扣標籤": "加入醒目的折扣標籤",
    "限時優惠": "加入限時優惠標示",
    "爆款標記": "加入爆款熱銷標記",
    "免運標示": "加入免運費標示"
};

const innerScenarios = {
    "規格圖": "【任務：規格表排版】請將畫面分為兩塊，一部分展示產品，另一部分使用清晰的清單來標示產品尺寸與規格。如有多種規格尺寸或顏色，請一併美觀排版展示出來。",
    "痛點對比": "【任務：痛點對比排版】強制將畫面「從中間劈開分為左右或上下兩半」，左邊用暗色調展示傳統產品的缺點(打叉叉)，右邊用明亮色調展示本產品的優勢(打勾勾)，形成強烈對比！仔細分析用戶上傳的產品圖片，識別品牌、型號、主要功能和銷售亮點，嚴格禁止將商品變形，確保商品細節呈現完整性。",
    "分鏡對比": "【任務：多重分鏡排版】將畫面切割為 3 個以上的獨立幾何方框（如同漫畫分鏡），分別展示產品的不同角度或局部特寫，具備雜誌高級感。仔細分析用戶上傳的產品圖片，識別品牌、型號、主要功能和銷售亮點，嚴格禁止將商品變形，確保商品細節呈現完整性。",
    "四象限": "【任務：四象限功能解析】畫面強制精準劃分為「田」字型的四個格子，每個格子放入一個產品特點圖示與解說文字。仔細分析用戶上傳的產品圖片，識別品牌、型號、主要功能和銷售亮點，嚴格禁止將商品變形，確保商品細節呈現完整性。",
    "使用情境": "【任務：生活情境代入】完美融入遠景的真實生活場景中（如客廳、廚房等依商品適合的場景做切換），背景要寬闊有空間感，只需在角落加上幾句簡短情境文案即可。仔細分析用戶上傳的產品圖片，識別品牌、型號、主要功能和銷售亮點，嚴格禁止將商品變形，確保商品細節呈現完整性。",
    "產品細節": "【任務：極致微距特寫】超近距離特寫產品的材質紋理，不需展示產品全貌，並搭配高質感的標籤指著細節進行解說。仔細分析用戶上傳的產品圖片，識別品牌、型號、主要功能和銷售亮點，嚴格禁止將商品變形，確保商品細節呈現完整性。"
};

const layoutFormats = {
    "預設混合": ["規格圖", "痛點對比", "分鏡對比", "分鏡對比", "四象限", "使用情境", "產品細節", "使用情境"],
    "痛點導向": ["規格圖", "痛點對比", "痛點對比", "分鏡對比", "分鏡對比", "使用情境", "使用情境", "使用情境"],
    "全產品細節": ["規格圖", "產品細節", "產品細節", "產品細節", "四象限", "產品細節", "產品細節", "產品細節"],
    "全使用情境": ["規格圖", "使用情境", "使用情境", "使用情境", "使用情境", "使用情境", "使用情境", "使用情境"] 
};

function previewImages(inputId, previewId) {
    const container = document.getElementById(previewId);
    const files = document.getElementById(inputId).files;
    container.innerHTML = ''; 
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-img';
            container.appendChild(img);
        }
        reader.readAsDataURL(files[i]);
    }
}

async function compressImage(file, maxWidth = 1024, maxHeight = 1024) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
        };
    });
}

async function filesToBase64Array(inputId) {
    const files = document.getElementById(inputId).files;
    const promises = Array.from(files).map(file => compressImage(file));
    return Promise.all(promises);
}

function downloadImageSafe(url, filename = 'SaaS_Image_4K.jpg') {
    if (!url) return;
    window.location.href = `${API_BASE_URL}/api/download_proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
}

async function downloadAllInnerImages() {
    const slots = document.querySelectorAll('.inner-slot.has-img .inner-img');
    if(slots.length === 0) return alert('目前還沒有完成生成的圖片可供下載！');
    
    const productName = document.getElementById('innerProductName').value || "未命名商品";
    const btn = document.getElementById('downloadAllInnerBtn');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.style.background = "#f59e0b";
    btn.innerText = `⏳ 準備打包 ${slots.length} 張圖片...`;
    
    try {
        const zip = new JSZip();
        let successCount = 0;
        
        for(let i=0; i<slots.length; i++) {
            const url = slots[i].src;
            btn.innerText = `⏳ 正在抓取第 ${i+1} / ${slots.length} 張圖片...`;
            try {
                const response = await fetch(`${API_BASE_URL}/api/download_proxy?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error("下載失敗");
                const blob = await response.blob();
                zip.file(`${productName}_P${i+1}.jpg`, blob);
                successCount++;
            } catch (e) { 
                console.error(`圖片 P${i+1} 抓取失敗`, e); 
            }
        }
        
        if (successCount === 0) throw new Error("所有圖片皆無法下載");

        btn.innerText = `📦 正在生成 ZIP 壓縮檔...`;
        const content = await zip.generateAsync({type:"blob"});
        
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = `${productName}_內文圖全套_4K.zip`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);

        btn.innerText = "✅ 打包下載成功！";
        btn.style.background = "#059669";
    } catch (error) {
        alert(`打包失敗：${error.message}`);
        btn.innerText = "❌ 打包失敗，請重試";
        btn.style.background = "#ef4444";
    } finally {
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
            btn.style.background = "#10b981";
        }, 3000);
    }
}

// ==========================================
// 🚀 發送首圖請求 (🌟 加入自動重試機制)
// ==========================================
async function startGeneration() {
    const subjectFiles = document.getElementById('subjectInput').files;
    if (subjectFiles.length === 0 || !document.getElementById('title1').value) return alert("主體圖與主標題必填！");

    const btn = document.getElementById('generateBtn');
    const statusText = document.getElementById('statusText');
    btn.disabled = true;
    document.getElementById('result-image').style.display = "none";
    document.getElementById('downloadBtn').style.display = "none";
    statusText.innerHTML = `📦 正在壓縮特徵並上傳大腦...`;

    try {
        const subjectB64 = await filesToBase64Array('subjectInput');
        const productB64 = await filesToBase64Array('productInput');
        const logoB64 = await filesToBase64Array('logoInput');

        // 依群組分流抓取 tag
        const suggestionGroups = document.querySelectorAll('#tab-hero .suggestion-group');

        const detailTags = suggestionGroups[0]
            ? Array.from(suggestionGroups[0].querySelectorAll('.prompt-tag.active')).map(btn => promptDictionary[btn.innerText.trim()] || btn.innerText.trim())
            : [];

        const titleEffectTags = suggestionGroups[1]
            ? Array.from(suggestionGroups[1].querySelectorAll('.prompt-tag.active')).map(btn => btn.innerText.trim())
            : [];

        const sceneTags = suggestionGroups[2]
            ? Array.from(suggestionGroups[2].querySelectorAll('.prompt-tag.active')).map(btn => promptDictionary[btn.innerText.trim()] || btn.innerText.trim())
            : [];

        const promoTags = suggestionGroups[3]
            ? Array.from(suggestionGroups[3].querySelectorAll('.prompt-tag.active')).map(btn => promptDictionary[btn.innerText.trim()] || btn.innerText.trim())
            : [];

        const manualPrompt = document.getElementById('customPrompt').value.trim();
        const finalCustomPrompt = [...detailTags, ...sceneTags, ...promoTags, manualPrompt].filter(Boolean).join('、');

        const payload = {
            subject_images: subjectB64,
            product_images: productB64,
            logo_image: logoB64[0] || "",
            category: document.getElementById('category').value,
            title_1: document.getElementById('title1').value,
            title_2: document.getElementById('title2').value,
            font_type: document.getElementById('fontType').value,
            font_layout: document.getElementById('fontLayout').value,
            sp_1: document.getElementById('sp1').value,
            sp_2: document.getElementById('sp2').value,
            sp_3: document.getElementById('sp3').value,
            detail_pos: document.getElementById('detailPos').value,
            detail_1: document.getElementById('dt1').value,
            detail_2: document.getElementById('dt2').value,
            detail_3: document.getElementById('dt3').value,
            title_effects: titleEffectTags,
            custom_prompt: finalCustomPrompt
        };

        const maxRetries = 2;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    statusText.innerHTML = `🔄 遭到退件，系統自動重新詠唱中 (第 ${attempt} 次重試)...`;
                }

                const res = await fetch(`${API_BASE_URL}/api/generate/hero`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error(`伺服器錯誤碼：${res.status}`);
                const data = await res.json();

                if (!data.task_id) throw new Error(data.detail || "未知錯誤");

                statusText.innerHTML = attempt === 0
                    ? `⏳ 任務已提交！AI 正在進行旗艦級構圖與渲染...`
                    : `⏳ 重試提交成功！正在進行重新構圖...`;

                const imageUrl = await pollStatusAsync(data.task_id, 'hero');

                currentImageUrl = imageUrl;
                document.getElementById('statusText').innerHTML = "🎉 大師級首圖生成完成！";
                document.getElementById('result-image').src = currentImageUrl;
                document.getElementById('result-image').style.display = "block";
                document.getElementById('downloadBtn').style.display = "block";
                document.getElementById('generateBtn').disabled = false;
                saveToHistory(currentImageUrl, document.getElementById('title1').value);

                return;
            } catch (err) {
                if (attempt === maxRetries) {
                    statusText.innerHTML = `❌ 最終生成失敗：${err.message}`;
                    btn.disabled = false;
                }
                await new Promise(r => setTimeout(r, 3000));
            }
        }

    } catch (error) {
        statusText.innerHTML = `❌ 執行失敗：${error.message}`;
        btn.disabled = false;
    }
}

// ==========================================
// 🚀 發送內文圖請求 (🌟 加入各槽位獨立重試機制)
// ==========================================
async function startGenerationInner() {
    const files = document.getElementById('innerSubjectInput').files;
    if (files.length === 0) return alert("請至少上傳一張「產品主體圖」！");
    
    const productName = document.getElementById('innerProductName').value || "未命名商品";
    const btn = document.getElementById('generateBtnInner');
    
    btn.disabled = true;
    btn.innerText = "⏳ 魔法施展中，請勿關閉網頁...";
    document.getElementById('inner-results-placeholder').style.display = "none";
    document.getElementById('inner-results-panel').style.display = "flex";
    document.getElementById('downloadAllInnerBtn').style.display = "none"; 
    
    for(let i=0; i<8; i++) updateSlotStatus(i, '📦 壓縮與排隊中...');

    try {
        const subjectB64 = await filesToBase64Array('innerSubjectInput');
        const p1RefB64 = await filesToBase64Array('innerP1RefInput');
        const specImgB64 = await filesToBase64Array('innerSpecImgInput');
        
        const overallStyle = document.getElementById('innerStyle').value;
        const pageFormat = document.querySelector('.page-format-tag.active').dataset.value;
        const p1Layout = document.querySelector('.p1-layout-tag.active').dataset.value;
        
        const specs = document.getElementById('innerSpecs').value;
        const accessories = document.getElementById('innerAccessories').value;
        
        const sps = [
            document.getElementById('innerSp1').value, 
            document.getElementById('innerSp2').value,
            document.getElementById('innerSp3').value,
            document.getElementById('innerSp4').value,
            document.getElementById('innerSp5').value
        ].filter(Boolean).join('、');
        
        const userNotes = document.getElementById('innerCustomPrompt').value;

        const scenariosToRun = layoutFormats[pageFormat];
        let completedCount = 0; 
        
        const checkAllCompleted = () => {
            completedCount++;
            if(completedCount === scenariosToRun.length) {
                document.getElementById('downloadAllInnerBtn').style.display = "block";
                btn.innerText = "✨ 重新生成全套詳情圖";
                btn.disabled = false;
                btn.style.background = "#7b61ff";
            }
        };

        // 獨立處理每一個版位的異步生成函數
        const runSlot = async (scenarioKey, index, p1Images) => {
            let promptBuilder = [];
            promptBuilder.push(`產品名稱：${productName}`);
            promptBuilder.push(`整體畫風要求：${overallStyle}`);
            
            if (index === 0) {
                promptBuilder.push(`排版版型：${p1Layout}`);
                if(specs) promptBuilder.push(`規格標示：${specs}`);
                if(accessories) promptBuilder.push(`組合配件：${accessories}`);
                if(specImgB64.length > 0) promptBuilder.push(`請務必參考附圖中的原始規格表資料來進行繪製。`);
            } else {
                if(sps) promptBuilder.push(`請結合以下賣點進行視覺設計：${sps}`);
            }
            if (userNotes) promptBuilder.push(`特別備註要求：${userNotes}`);

            const payload = {
                subject_images: subjectB64,
                reference_images: p1Images, 
                category: document.getElementById('innerCategory').value,
                scenario_prompt: innerScenarios[scenarioKey], 
                custom_prompt: promptBuilder.join('。')       
            };

            const titleToSave = `${productName}_P${index+1}`;
            const maxRetries = 2; // 每格最多允許退件重試 2 次

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        updateSlotStatus(index, `🔄 AI 退件，重新詠唱中 (第 ${attempt} 次重試)...`);
                    } else {
                        updateSlotStatus(index, '⏳ 商業攝影排版運算中...');
                    }

                    const res = await fetch(`${API_BASE_URL}/api/generate/inner`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                    if (!res.ok) throw new Error(`錯誤碼 ${res.status}`);
                    const data = await res.json();
                    
                    if (!data.task_id) throw new Error("無效任務ID");
                    
                    // 等待生圖完成
                    const imageUrl = await pollStatusAsync(data.task_id, 'inner', index, titleToSave);
                    
                    // 成功即展示並跳出迴圈
                    showInnerImage(index, imageUrl, titleToSave);
                    saveToHistory(imageUrl, titleToSave);
                    checkAllCompleted();
                    return; 

                } catch (err) {
                    if (attempt === maxRetries) {
                        updateSlotStatus(index, `❌ 最終生成失敗: 達到最大重試次數`);
                        checkAllCompleted(); // 失敗也必須計入完成數量，避免按鈕卡死
                        return;
                    }
                    await new Promise(r => setTimeout(r, 3000)); // 失敗後停頓再出發
                }
            }
        };

        for (let index = 0; index < scenariosToRun.length; index++) {
            const scenarioKey = scenariosToRun[index];
            const p1Images = (index === 0) ? [...p1RefB64, ...specImgB64] : [];
            
            // 將每個格子直接丟入背景異步執行
            runSlot(scenarioKey, index, p1Images);
            
            // 延遲 1.5 秒再丟下一個格子，避免瞬間併發量過大被伺服器阻擋
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        btn.innerText = "⏳ 8張排版並行運算中 (約需3-5分)...";
        btn.style.background = "#f59e0b"; 

    } catch (error) {
        alert(`提交失敗: ${error.message}`);
        btn.disabled = false;
        btn.innerText = "✨ 一鍵生成全套詳情圖 (8張)";
    }
}

// ==========================================
// 🚀 發送文案與標題請求 (純文字生成較快，維持不變)
// ==========================================
async function startGenerationCopy() {
    const files = document.getElementById('copyImageInput').files;
    const productName = document.getElementById('copyProductName').value;
    
    if (files.length === 0) return alert("請至少上傳一張圖片，讓 AI 能夠看圖說故事！");
    if (!productName) return alert("請輸入商品名稱！");

    const btn = document.getElementById('generateBtnCopy');
    const loadingUI = document.getElementById('copyLoading');
    const resultTextArea = document.getElementById('copyResultText');
    const copyBtn = document.getElementById('copyToClipboardBtn');

    btn.disabled = true;
    btn.innerText = "⏳ AI 撰寫中...";
    resultTextArea.style.display = "none";
    copyBtn.style.display = "none";
    loadingUI.style.display = "block";

    try {
        const imagesB64 = await filesToBase64Array('copyImageInput');
        
        const payload = {
            images: imagesB64,
            product_name: productName,
            selling_points: document.getElementById('copySellingPoints').value,
            custom_prompt: document.getElementById('copyCustomPrompt').value
        };

        const res = await fetch(`${API_BASE_URL}/api/generate/copy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`伺服器錯誤碼：${res.status}`);
        const data = await res.json();

        if (data.status === "success") {
            loadingUI.style.display = "none";
            resultTextArea.value = data.data;
            resultTextArea.style.display = "block";
            copyBtn.style.display = "block";
            btn.innerText = "✨ 重新產生文案";
        } else {
            throw new Error(data.detail || "未知錯誤");
        }
    } catch (error) {
        alert(`文案產生失敗: ${error.message}`);
        loadingUI.style.display = "none";
        btn.innerText = "✨ AI 智慧看圖寫文案";
    } finally {
        btn.disabled = false;
    }
}

async function startGenerationTitle() {
    const keyword = document.getElementById('titleMainKeyword').value;
    if (!keyword) return alert("⚠️ 為了演算法生效，主關鍵字為必填！");

    const btn = document.getElementById('generateBtnTitle');
    const loadUI = document.getElementById('titleLoading');
    const resText = document.getElementById('titleResultText');
    const copyBtn = document.getElementById('titleToClipboardBtn');

    btn.disabled = true;
    btn.innerText = "⏳ 演算法運算中...";
    resText.style.display = "none";
    copyBtn.style.display = "none";
    loadUI.style.display = "block";

    try {
        const payload = {
            main_keyword: keyword,
            marketing_words: document.getElementById('titleMarketing').value,
            product_specs: document.getElementById('titleSpecs').value,
            category_words: document.getElementById('titleCategory').value
        };

        const res = await fetch(`${API_BASE_URL}/api/generate/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`伺服器錯誤碼：${res.status}`);
        const data = await res.json();

        if (data.status === "success") {
            loadUI.style.display = "none";
            resText.value = data.data;
            resText.style.display = "block";
            copyBtn.style.display = "block";
            btn.innerText = "🚀 重新運算標題";
        } else {
            throw new Error(data.detail || "未知錯誤");
        }
    } catch (error) {
        alert(`標題運算失敗: ${error.message}`);
        loadUI.style.display = "none";
        btn.innerText = "🚀 啟動標題演算法";
    } finally {
        btn.disabled = false;
    }
}

function copyTextToClipboard(textareaId, btnId) {
    const text = document.getElementById(textareaId);
    text.select();
    document.execCommand("copy");
    
    const btn = document.getElementById(btnId);
    const oldText = btn.innerText;
    btn.innerText = "✅ 複製成功！";
    btn.style.background = "#059669";
    setTimeout(() => {
        btn.innerText = oldText;
        btn.style.background = "#10b981";
    }, 3000);
}

// ==========================================
// 🚀 核心升級：等待型非同步輪詢機制 (Promise)
// ==========================================
function pollStatusAsync(taskId, type, slotIndex = null, titleToSave = null) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/status/${taskId}`);
                const data = await res.json();

                if (data.status === "completed") {
                    clearInterval(interval);
                    resolve(data.image_url); // 成功抓到圖片，解除 Promise 封印
                } else if (data.status === "failed") {
                    clearInterval(interval);
                    reject(new Error(data.detail || "AI退件")); // 失敗，直接丟給外層 catch 觸發重試
                }
            } catch (error) { 
                // 查詢過程網路不穩，不中斷，只顯示提示
                if (type === 'inner') updateSlotStatus(slotIndex, `⏳ 網路連線等待中...`);
            }
        }, 8000);
    });
}

function updateSlotStatus(index, text) {
    const slot = document.getElementById(`inner-slot-${index}`);
    const loading = slot.querySelector('.inner-loading');
    slot.classList.remove('has-img');
    loading.style.display = 'block';
    slot.querySelector('.inner-img').style.display = 'none';
    loading.innerText = text;
}

function showInnerImage(index, imageUrl, title) {
    const slot = document.getElementById(`inner-slot-${index}`);
    const loading = slot.querySelector('.inner-loading');
    const img = slot.querySelector('.inner-img');
    slot.classList.add('has-img');
    loading.style.display = 'none';
    img.src = imageUrl;
    img.style.display = 'block';
    slot.querySelector('.inner-download-overlay').onclick = () => downloadImageSafe(imageUrl, `${title}.jpg`);
}

// ==========================================
// 💾 歷史紀錄管理
// ==========================================
function saveToHistory(imageUrl, title) {
    let history = JSON.parse(localStorage.getItem('saas_history') || '[]');
    if (!history.find(item => item.url === imageUrl)) {
        history.unshift({ url: imageUrl, title: title || '未命名圖片', time: new Date().toLocaleString('zh-TW', { hour12: false }) });
        if(history.length > 50) history.pop();
        localStorage.setItem('saas_history', JSON.stringify(history));
    }
}

function renderHistory() {
    const grid = document.getElementById('history-grid');
    let history = JSON.parse(localStorage.getItem('saas_history') || '[]');
    if(history.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#999; padding: 50px;">目前還沒有任何生成紀錄喔！趕快去製作一張吧！</div>';
        return;
    }
    grid.innerHTML = history.map(item => `
        <div class="history-card">
            <img src="${item.url}" class="history-img" onerror="this.src=''; this.alt='⚠️ 圖片已過期'; this.style.display='flex';">
            <div class="history-title">${item.title}</div>
            <div class="history-time">${item.time}</div>
            <button class="history-dl-btn" onclick="downloadImageSafe('${item.url}', '${item.title}.jpg')">⬇️ 下載 / 查看</button>
        </div>
    `).join('');
}

function clearHistory() {
    if(confirm("確定清空紀錄？")) { localStorage.removeItem('saas_history'); renderHistory(); }
}