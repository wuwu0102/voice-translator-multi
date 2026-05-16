# 多語語音翻譯工具（Vite + Vanilla JS）

這是一個使用 **Vite + Vanilla JavaScript** 建立的多語語音翻譯工具前端專案。

## 功能

- Web Speech API 語音辨識
- 支援語言模式：
  - 英文（`en-US`）
  - 西文（墨西哥，`es-MX`）
  - 西文（西班牙，`es-ES`）
  - 德文（`de-DE`）
  - 俄文（`ru-RU`）
- 所有模式皆翻譯成中文（`zh-TW`）
- 翻譯架構可替換：
  - 預設使用 `mockTranslate`
  - 若設定 `VITE_GOOGLE_TRANSLATE_API_KEY` 則可改用 Google Translate API

## 安裝與啟動

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview
```

## 設定 Google Translate API Key

1. 複製範例環境檔：

```bash
cp .env.example .env
```

2. 編輯 `.env`，填入金鑰：

```env
VITE_GOOGLE_TRANSLATE_API_KEY=your_actual_key
```

3. 重新啟動開發伺服器。

> 若未設定 API key，系統會自動改用 `mockTranslate`，仍可正常操作畫面流程。

## GitHub Pages 部署

1. 安裝 `gh-pages`（可選）：

```bash
npm install --save-dev gh-pages
```

2. 在 `package.json` 補充：

```json
{
  "homepage": "https://<your-username>.github.io/voice-translator-multi",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. 執行部署：

```bash
npm run deploy
```

若使用 GitHub Actions，也可將 `dist/` 發佈到 `gh-pages` branch。
