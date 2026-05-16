const API_BASE = import.meta.env.VITE_TRANSLATE_API_BASE?.trim();

export function getTranslationServiceStatus() {
  return {
    configured: Boolean(API_BASE),
    label: API_BASE ? "Google Translate + GPT 修正" : "尚未設定"
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
      error: "尚未設定翻譯 API，請先部署 Cloudflare Worker"
    };
  }

  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
      cleanedByGpt: data.cleanedByGpt !== false,
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
      error: "翻譯服務尚未設定或 API 發生錯誤"
    };
  }
}
