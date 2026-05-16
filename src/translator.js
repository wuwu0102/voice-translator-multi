const API_BASE = import.meta.env.VITE_TRANSLATE_API_BASE?.trim();
const OPENAI_KEY_STORAGE_KEY = "openai_api_key";

export function getStoredOpenAiApiKey() {
  return localStorage.getItem(OPENAI_KEY_STORAGE_KEY)?.trim() || "";
}

export function saveOpenAiApiKey(key) {
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
    return "";
  }
  localStorage.setItem(OPENAI_KEY_STORAGE_KEY, trimmed);
  return trimmed;
}

export function clearOpenAiApiKey() {
  localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
}

export function getTranslationServiceStatus() {
  const hasOpenAiKey = Boolean(getStoredOpenAiApiKey());
  return {
    configured: Boolean(API_BASE),
    hasOpenAiKey,
    label: hasOpenAiKey
      ? "Google Translate + 使用者 GPT Key"
      : "Google Translate（未啟用 GPT 修正）"
  };
}

export async function translateSegment(text, modeConfig) {
  const trimmed = text?.trim();
  if (!trimmed) {
    return {
      ok: false,
      sourceText: "",
      cleanedText: "",
      translatedText: "",
      cleanedByGpt: false,
      gptError: "",
      error: "翻譯服務尚未設定或 API 發生錯誤"
    };
  }

  if (!API_BASE) {
    return {
      ok: false,
      sourceText: trimmed,
      cleanedText: trimmed,
      translatedText: "翻譯服務尚未設定或 API 發生錯誤",
      cleanedByGpt: false,
      gptError: "",
      error: "尚未設定翻譯 API，請先部署 Cloudflare Worker"
    };
  }

  const openAiApiKey = getStoredOpenAiApiKey();

  try {
    const headers = {
      "Content-Type": "application/json"
    };

    if (openAiApiKey) {
      headers["X-OpenAI-API-Key"] = openAiApiKey;
    }

    const response = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: trimmed,
        sourceLang: modeConfig.recognitionLang,
        targetLang: modeConfig.targetLang,
        mode: modeConfig.apiMode
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    return {
      ok: true,
      sourceText: data.sourceText ?? trimmed,
      cleanedText: data.cleanedText ?? trimmed,
      translatedText: data.translatedText ?? "",
      cleanedByGpt: data.cleanedByGpt === true,
      gptError: data.gptError ?? "",
      error: ""
    };
  } catch (error) {
    console.error("translateSegment failed:", error);
    return {
      ok: false,
      sourceText: trimmed,
      cleanedText: trimmed,
      translatedText: "翻譯服務尚未設定或 API 發生錯誤",
      cleanedByGpt: false,
      gptError: "",
      error: "翻譯服務尚未設定或 API 發生錯誤"
    };
  }
}
