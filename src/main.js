import "./style.css";
import { translateText } from "./translator";

const languageModes = [
  { id: "en", label: "英文模式", recognitionLang: "en-US", targetLang: "zh-TW", targetLabel: "中文" },
  { id: "es-mx", label: "西文模式（墨西哥）", recognitionLang: "es-MX", targetLang: "zh-TW", targetLabel: "中文" },
  { id: "es-es", label: "西文模式（西班牙）", recognitionLang: "es-ES", targetLang: "zh-TW", targetLabel: "中文" },
  { id: "de", label: "德文模式", recognitionLang: "de-DE", targetLang: "zh-TW", targetLabel: "中文" },
  { id: "ru", label: "俄文模式", recognitionLang: "ru-RU", targetLang: "zh-TW", targetLabel: "中文" }
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  selectedModeId: languageModes[0].id,
  listening: false,
  meetingMode: false,
  sourceText: "",
  translatedText: "",
  translationService: import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY ? "Google" : "Mock（未設定 API Key）"
};

let recognition;

const app = document.querySelector("#app");
app.innerHTML = `
  <header class="top-bar"><span class="version-badge">v1</span></header>
  <button id="main-action" class="main-action">🎤 點我開始翻譯</button>

  <section class="panel">
    <div id="mode-buttons" class="grid-buttons"></div>
  </section>

  <section class="panel">
    <div class="grid-buttons">
      <button id="meeting-mode-btn" class="feature-btn">🧠 會議模式：關</button>
      <button id="settings-btn" class="feature-btn">⚙️ 設定</button>
      <button id="clear-btn" class="feature-btn">🗑️ 清空</button>
    </div>
  </section>

  <section class="panel">
    <ul class="status-list">
      <li>語音辨識：<span id="speech-status">待機</span></li>
      <li>翻譯服務：<span id="translation-service"></span></li>
      <li>翻譯目標語言：<span id="target-language"></span></li>
    </ul>
  </section>

  <section class="result-grid">
    <article class="panel card">
      <h3>原文</h3>
      <p id="source-text" class="hint">尚無內容</p>
    </article>
    <article class="panel card">
      <h3>翻譯結果</h3>
      <p id="translated-text" class="hint">尚無內容</p>
    </article>
  </section>
`;

const mainActionBtn = document.querySelector("#main-action");
const modeButtonsContainer = document.querySelector("#mode-buttons");
const meetingModeBtn = document.querySelector("#meeting-mode-btn");
const settingsBtn = document.querySelector("#settings-btn");
const clearBtn = document.querySelector("#clear-btn");
const speechStatusEl = document.querySelector("#speech-status");
const translationServiceEl = document.querySelector("#translation-service");
const targetLanguageEl = document.querySelector("#target-language");
const sourceTextEl = document.querySelector("#source-text");
const translatedTextEl = document.querySelector("#translated-text");

function getSelectedMode() {
  return languageModes.find((mode) => mode.id === state.selectedModeId) ?? languageModes[0];
}

function renderModeButtons() {
  modeButtonsContainer.innerHTML = languageModes
    .map(
      (mode) =>
        `<button class="mode-btn ${mode.id === state.selectedModeId ? "active" : ""}" data-mode-id="${mode.id}">${mode.label}</button>`
    )
    .join("");
}

function render() {
  renderModeButtons();
  const selectedMode = getSelectedMode();

  mainActionBtn.textContent = state.listening ? "🛑 停止翻譯" : "🎤 點我開始翻譯";
  mainActionBtn.classList.toggle("listening", state.listening);
  speechStatusEl.textContent = state.listening ? "聆聽中" : "待機";
  meetingModeBtn.textContent = `🧠 會議模式：${state.meetingMode ? "開" : "關"}`;
  translationServiceEl.textContent = state.translationService;
  targetLanguageEl.textContent = selectedMode.targetLabel;

  sourceTextEl.textContent = state.sourceText || "尚無內容";
  translatedTextEl.textContent = state.translatedText || "尚無內容";
  sourceTextEl.classList.toggle("hint", !state.sourceText);
  translatedTextEl.classList.toggle("hint", !state.translatedText);
}

async function handleRecognizedText(text) {
  state.sourceText = text.trim();
  render();

  const selectedMode = getSelectedMode();
  const translated = await translateText(state.sourceText, selectedMode.targetLang);
  state.translatedText = translated || "（翻譯失敗）";
  render();
}

function stopListening() {
  if (recognition && state.listening) {
    recognition.stop();
  }
  state.listening = false;
  render();
}

function startListening() {
  if (!SpeechRecognition) {
    alert("此瀏覽器不支援 Web Speech API，請改用最新版 Chrome。 ");
    return;
  }

  const selectedMode = getSelectedMode();

  recognition = new SpeechRecognition();
  recognition.lang = selectedMode.recognitionLang;
  recognition.interimResults = false;
  recognition.continuous = state.meetingMode;

  recognition.onstart = () => {
    state.listening = true;
    render();
  };

  recognition.onresult = async (event) => {
    const resultText = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();

    if (resultText) {
      await handleRecognizedText(resultText);
    }

    if (!state.meetingMode) {
      stopListening();
    }
  };

  recognition.onend = () => {
    state.listening = false;
    render();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    state.listening = false;
    render();
  };

  recognition.start();
}

mainActionBtn.addEventListener("click", () => {
  if (state.listening) {
    stopListening();
  } else {
    startListening();
  }
});

modeButtonsContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const modeId = target.dataset.modeId;
  if (!modeId || modeId === state.selectedModeId) return;

  state.selectedModeId = modeId;
  stopListening();
  render();
});

meetingModeBtn.addEventListener("click", () => {
  state.meetingMode = !state.meetingMode;
  if (state.listening) {
    stopListening();
    startListening();
  } else {
    render();
  }
});

settingsBtn.addEventListener("click", () => {
  alert("目前設定：翻譯服務會在有 API Key 時使用 Google，否則使用 Mock。\n可於 .env 設定 VITE_GOOGLE_TRANSLATE_API_KEY。");
});

clearBtn.addEventListener("click", () => {
  state.sourceText = "";
  state.translatedText = "";
  render();
});

render();
