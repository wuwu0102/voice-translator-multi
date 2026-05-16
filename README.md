# 多語語音翻譯工具（Vite + Vanilla JS + Cloudflare Worker）

此專案使用前後端分離翻譯架構：

1. 前端以 Web Speech API 進行語音辨識。
2. 前端將辨識結果做句子切段。
3. 每段送至 Cloudflare Worker `/api/translate`。
4. 若使用者有在前端設定 OpenAI API Key，Worker 會先用 GPT 做語音辨識文字整理（不翻譯）。
5. 再用 Google Translate API 翻譯成 `zh-TW`。

## 專案結構

- `src/main.js`：UI、語音辨識、切段與段落翻譯流程
- `src/translator.js`：呼叫後端 API 的翻譯函式與 OpenAI Key localStorage 管理
- `src/style.css`：樣式
- `worker/index.js`：Cloudflare Worker proxy
- `worker/wrangler.toml.example`：Worker 設定範例
- `.env.example`：前端環境變數範例

## 前端環境變數

複製檔案：

```bash
cp .env.example .env
```

設定：

```env
VITE_TRANSLATE_API_BASE=https://your-worker-domain.workers.dev
```

若未設定 `VITE_TRANSLATE_API_BASE`，前端會顯示：
- 「翻譯服務：尚未設定」
- 「尚未設定翻譯 API，請先部署 Cloudflare Worker」

## OpenAI API Key（使用者自行輸入）

1. 在網頁點擊「⚙️ 設定」。
2. 輸入自己的 OpenAI API Key 後按「儲存」。
3. API Key 僅儲存在使用者瀏覽器 `localStorage`。
4. API Key 不會儲存在 GitHub、Cloudflare Worker、或本站伺服器。

若沒有設定 OpenAI API Key：
- 仍可正常翻譯（Google Translate）
- 只是不會先進行 GPT 修正

## Cloudflare Worker 設定

1. 進入 `worker/` 目錄部署 Worker。
2. 使用 `wrangler.toml.example` 建立實際設定。
3. 將 Google Translate API Key 放在 Worker 的 secrets 或 vars（不可放前端）。

必要變數：
- `GOOGLE_TRANSLATE_API_KEY`

> 安全要求：
> - GitHub Pages 前端只能呼叫 Worker。
> - `GOOGLE_TRANSLATE_API_KEY` 僅能放在 Cloudflare Worker（secrets 或 vars）。
> - OpenAI API Key 改為每位使用者自行輸入，僅存在使用者瀏覽器 localStorage。

## 部署說明

- 前端部署：GitHub Pages（保留現有 workflow）
- 後端部署：Cloudflare Worker
- `vite.config.js` 已設定 base path

## 本機開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview
```
