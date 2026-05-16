const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GOOGLE_TRANSLATE_API_URL = "https://translation.googleapis.com/language/translate/v2";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    ...init
  });
}

async function cleanTextWithGpt(text, sourceLang, env) {
  if (!env.OPENAI_API_KEY) {
    return { cleanedText: text, cleanedByGpt: false };
  }

  const prompt = `You are an ASR text post-processor.\nSource language: ${sourceLang}.\nOnly fix obvious recognition typos and punctuation.\nDo not change meaning.\nDo not translate.\nKeep original language.\nOutput only cleaned text.`;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: prompt },
        { role: "user", content: text }
      ],
      max_output_tokens: 400
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const cleaned = data.output_text?.trim();
  return { cleanedText: cleaned || text, cleanedByGpt: true };
}

async function translateWithGoogle(text, targetLang, env) {
  if (!env.GOOGLE_TRANSLATE_API_KEY) {
    throw new Error("Google Translate API key is missing");
  }

  const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${encodeURIComponent(env.GOOGLE_TRANSLATE_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target: targetLang, format: "text" })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Translate API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText || "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/translate" || request.method !== "POST") {
      return json({ ok: false, error: "Not found" }, { status: 404 });
    }

    try {
      const body = await request.json();
      const { text, sourceLang = "en-US", targetLang = "zh-TW" } = body || {};

      if (!text || !String(text).trim()) {
        return json({ ok: false, error: "text is required" }, { status: 400 });
      }

      let cleanedText = String(text).trim();
      let cleanedByGpt = false;

      try {
        const cleaned = await cleanTextWithGpt(cleanedText, sourceLang, env);
        cleanedText = cleaned.cleanedText;
        cleanedByGpt = cleaned.cleanedByGpt;
      } catch (error) {
        console.warn("OpenAI cleanup failed, fallback to source text", error);
      }

      try {
        const translatedText = await translateWithGoogle(cleanedText, targetLang, env);
        return json({ ok: true, sourceText: text, cleanedText, translatedText, targetLang, cleanedByGpt });
      } catch (error) {
        return json({ ok: false, error: `Google Translate failed: ${error.message}` }, { status: 502 });
      }
    } catch (error) {
      return json({ ok: false, error: `Bad request: ${error.message}` }, { status: 400 });
    }
  }
};
