# 多語語音翻譯工具（Vite + Vanilla JS + Cloudflare Worker）

## 模式說明

- **一般模式**：適合一句一句翻譯。按下開始後，抓到一段 final transcript 會自動翻譯並停止聆聽。
- **會議模式**：適合工程會議。按下開始後會持續聆聽，依標點/長度/停頓/final transcript 自動切段，直到你再次按主按鈕停止。

## 工程術語保護（Glossary Protection）

系統內建工程術語保護（如 CRAC、PDU、VESDA、CDU Loop、Liquid Cooling 等）：

1. 翻譯前先替換為 `__TERM_001__` 這類 placeholder。
2. GPT cleanup 階段禁止修改 placeholder。
3. Google Translate 完成後再還原術語。

用途：避免關鍵工程詞彙被 GPT 或翻譯引擎錯翻。

## OpenAI API Key（前端設定）

1. 點擊「⚙️ 設定」。
2. 輸入 OpenAI API Key 後按「儲存」。
3. Key 僅存於瀏覽器 localStorage，不會存到本站伺服器。

> 不填 OpenAI API Key 也可使用：系統會直接走 Google 翻譯（略過 GPT 修正）。

## Cloudflare Worker 與 Google Translate API Key

1. 進入 `worker/` 部署 Worker。
2. 設定 `GOOGLE_TRANSLATE_API_KEY`（請放在 Worker secrets/vars，不可放前端）。
3. 前端 `.env` 設定：

```env
VITE_TRANSLATE_API_BASE=https://your-worker-domain.workers.dev
```

如果未設定 Worker API base，前端會顯示：
「尚未設定翻譯 API，請先部署 Cloudflare Worker」。

## 專案結構

- `src/main.js`：語音辨識、一般/會議模式、切段、UI
- `src/glossary.js`：工程術語保護/還原
- `src/translator.js`：呼叫 Worker API 與 OpenAI Key localStorage
- `src/style.css`：桌機/手機樣式
- `worker/index.js`：Cloudflare Worker（GPT cleanup + Google Translate）

## 本機

```bash
npm install
npm run dev
npm run build
```
