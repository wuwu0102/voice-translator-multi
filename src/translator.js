const GOOGLE_TRANSLATE_API_URL = "https://translation.googleapis.com/language/translate/v2";

export async function mockTranslate(text, targetLang = "zh-TW") {
  await new Promise((resolve) => setTimeout(resolve, 240));
  return `【Mock 翻譯 -> ${targetLang}】${text}`;
}

export async function googleTranslate(text, targetLang = "zh-TW") {
  const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Translate API key.");
  }

  const response = await fetch(
    `${GOOGLE_TRANSLATE_API_URL}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: "text"
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText ?? "";
}

export async function translateText(text, targetLang = "zh-TW") {
  const trimmed = text?.trim();
  if (!trimmed) return "";

  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY);

  if (!hasApiKey) {
    return mockTranslate(trimmed, targetLang);
  }

  try {
    return await googleTranslate(trimmed, targetLang);
  } catch (error) {
    console.warn("Google Translate failed, fallback to mockTranslate:", error);
    return mockTranslate(trimmed, targetLang);
  }
}
