import "./style.css";
import { getTranslationServiceStatus, translateSegment } from "./translator";

const languageModes = [
  { id: "en", label: "英文模式", recognitionLang: "en-US", targetLang: "zh-TW", targetLabel: "中文", apiMode: "english" },
  { id: "es-mx", label: "西文模式（墨西哥）", recognitionLang: "es-MX", targetLang: "zh-TW", targetLabel: "中文", apiMode: "spanish-mx" },
  { id: "es-es", label: "西文模式（西班牙）", recognitionLang: "es-ES", targetLang: "zh-TW", targetLabel: "中文", apiMode: "spanish-es" },
  { id: "de", label: "德文模式", recognitionLang: "de-DE", targetLang: "zh-TW", targetLabel: "中文", apiMode: "german" },
  { id: "ru", label: "俄文模式", recognitionLang: "ru-RU", targetLang: "zh-TW", targetLabel: "中文", apiMode: "russian" }
];

const PAUSE_MS = 1200;
const MAX_SEGMENT_LENGTH = 120;
const SEGMENT_PUNCTUATION = /[.!?。？！]/;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const serviceStatus = getTranslationServiceStatus();

const state = {
  selectedModeId: languageModes[0].id,
  listening: false,
  meetingMode: false,
  translationService: serviceStatus.label,
  segments: [],
  currentBuffer: ""
};

let recognition;
let pauseTimer;
let lastFinalAt = 0;

const app = document.querySelector("#app");
app.innerHTML = `
  <header class="top-bar"><span class="version-badge">v2</span></header>
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
    <p id="service-message" class="warning-text"></p>
  </section>

  <section class="result-grid">
    <article class="panel card">
      <h3>原文</h3>
      <div id="source-segments" class="segment-list"><p class="hint">尚無內容</p></div>
    </article>
    <article class="panel card">
      <h3>翻譯結果</h3>
      <div id="translated-segments" class="segment-list"><p class="hint">尚無內容</p></div>
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
const sourceSegmentsEl = document.querySelector("#source-segments");
const translatedSegmentsEl = document.querySelector("#translated-segments");
const serviceMessageEl = document.querySelector("#service-message");

function getSelectedMode() {
  return languageModes.find((mode) => mode.id === state.selectedModeId) ?? languageModes[0];
}

function renderModeButtons() { /* unchanged pattern */
  modeButtonsContainer.innerHTML = languageModes
    .map((mode) => `<button class="mode-btn ${mode.id === state.selectedModeId ? "active" : ""}" data-mode-id="${mode.id}">${mode.label}</button>`)
    .join("");
}

function renderSegments() {
  if (!state.segments.length) {
    sourceSegmentsEl.innerHTML = '<p class="hint">尚無內容</p>';
    translatedSegmentsEl.innerHTML = '<p class="hint">尚無內容</p>';
    return;
  }

  sourceSegmentsEl.innerHTML = state.segments
    .map((segment, index) => `<div class="segment-item"><span class="segment-index">#${index + 1}</span><p>${segment.sourceText}</p></div>`)
    .join("");

  translatedSegmentsEl.innerHTML = state.segments
    .map((segment) => `
      <div class="segment-item">
        <p>${segment.translatedText}</p>
        <small>GPT 修正：${segment.cleanedByGpt ? "成功" : "未使用"}</small><br>
        <small>Google 翻譯：${segment.ok ? "成功" : "失敗"}</small>
      </div>
    `)
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
  serviceMessageEl.textContent = serviceStatus.configured ? "" : "尚未設定翻譯 API，請先部署 Cloudflare Worker";
  renderSegments();
}

function shouldFlushSegment(text) {
  return SEGMENT_PUNCTUATION.test(text) || text.length >= MAX_SEGMENT_LENGTH;
}

async function flushSegment(force = false) {
  const text = state.currentBuffer.trim();
  if (!text) return;
  if (!force && !shouldFlushSegment(text)) return;

  state.currentBuffer = "";
  const selectedMode = getSelectedMode();
  const result = await translateSegment(text, selectedMode);

  state.segments.push({
    sourceText: text,
    translatedText: result.translatedText || "翻譯服務尚未設定或 API 發生錯誤",
    cleanedByGpt: result.cleanedByGpt,
    ok: result.ok
  });

  render();

  if (!state.meetingMode) {
    stopListening();
  }
}

function resetPauseTimer() {
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    if (Date.now() - lastFinalAt >= PAUSE_MS) {
      flushSegment(true);
    }
  }, PAUSE_MS + 20);
}

function stopListening() {
  clearTimeout(pauseTimer);
  if (recognition && state.listening) recognition.stop();
  state.listening = false;
  render();
}

function startListening() {
  if (!SpeechRecognition) {
    alert("此瀏覽器不支援 Web Speech API，請改用最新版 Chrome。");
    return;
  }

  const selectedMode = getSelectedMode();
  recognition = new SpeechRecognition();
  recognition.lang = selectedMode.recognitionLang;
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    state.listening = true;
    render();
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result.isFinal) continue;

      const finalText = result[0].transcript.trim();
      if (!finalText) continue;

      state.currentBuffer = `${state.currentBuffer} ${finalText}`.trim();
      lastFinalAt = Date.now();
      resetPauseTimer();
      flushSegment(false);
    }
  };

  recognition.onend = () => {
    state.listening = false;
    if (state.meetingMode) {
      startListening();
      return;
    }
    flushSegment(true);
    render();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    state.listening = false;
    render();
  };

  recognition.start();
}

mainActionBtn.addEventListener("click", () => (state.listening ? stopListening() : startListening()));
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
  }
  render();
});
settingsBtn.addEventListener("click", () => {
  alert("翻譯服務架構：Web Speech API 分段 -> GPT 修正 -> Google Translate（透過 Cloudflare Worker）");
});
clearBtn.addEventListener("click", () => {
  state.segments = [];
  state.currentBuffer = "";
  render();
});

render();
