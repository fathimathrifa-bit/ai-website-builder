document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generateBtn");
    const promptInput = document.getElementById("promptInput");
    const sectionTarget = document.getElementById("sectionTarget");
    const loader = document.getElementById("loader");
    const previewFrame = document.getElementById("previewFrame");
    const htmlCodeDisplay = document.getElementById("htmlCodeDisplay");
    const cssCodeDisplay = document.getElementById("cssCodeDisplay");
    const historyList = document.getElementById("historyList");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    const copyBtn = document.getElementById("copyBtn");

    let currentGeneration = { html: "", css: "" };
    let activeTab = "preview";

    function renderToPreview(html, css) {
        const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}</body></html>`);
        frameDoc.close();
        htmlCodeDisplay.textContent = html;
        cssCodeDisplay.textContent = css;
    }

    async function handleGeneration() {
        const prompt = promptInput.value.trim();
        const targetSection = sectionTarget.value;

        if (!prompt) {
            alert("Please provide layout criteria descriptions first!");
            return;
        }

        loader.classList.remove("hidden");

        try {
            const response = await fetch("http://127.0.0.1:5000/api/generate-website", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt, section: targetSection || null })
            });

            const data = await response.json();
            if (data.success) {
                if (targetSection && currentGeneration.html) {
                    currentGeneration.css += `\n/* Component Fix */\n${data.css}`;
                    currentGeneration.html += `\n\n${data.html}`;
                } else {
                    currentGeneration.html = data.html;
                    currentGeneration.css = data.css;
                }
                renderToPreview(currentGeneration.html, currentGeneration.css);
                saveToHistory(prompt, currentGeneration.html, currentGeneration.css);
            } else {
                alert(`Execution Break: ${data.error}`);
            }
        } catch (error) {
            alert("Connection down. Make sure your Python application server is actively executing.");
        } finally {
            loader.classList.add("hidden");
        }
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.getAttribute("data-tab");
            document.getElementById(`${activeTab}Tab`).classList.add("active");
        });
    });

    function saveToHistory(prompt, html, css) {
        let items = JSON.parse(localStorage.getItem("dev_studio_history")) || [];
        items.unshift({ prompt, html, css });
        localStorage.setItem("dev_studio_history", JSON.stringify(items.slice(0, 10)));
        loadHistoryUI();
    }

    function loadHistoryUI() {
        historyList.innerHTML = "";
        let items = JSON.parse(localStorage.getItem("dev_studio_history")) || [];
        items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item.prompt;
            li.addEventListener("click", () => {
                currentGeneration.html = item.html;
                currentGeneration.css = item.css;
                renderToPreview(item.html, item.css);
            });
            historyList.appendChild(li);
        });
    }

    copyBtn.addEventListener("click", () => {
        let txt = activeTab === "css-code" ? currentGeneration.css : currentGeneration.html;
        navigator.clipboard.writeText(txt);
        alert("Source block code content buffered!");
    });

    clearHistoryBtn.addEventListener("click", () => {
        localStorage.removeItem("dev_studio_history");
        loadHistoryUI();
    });

    generateBtn.addEventListener("click", handleGeneration);
    loadHistoryUI();
});