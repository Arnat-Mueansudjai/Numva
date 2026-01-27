/* =========================
   DOM REFERENCES
========================= */
const character = document.getElementById("ai-character");
const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

/* =========================
   PNGTuber STATES
========================= */
const states = {
  idle: "pngtuber/idle.png",
  startled: "pngtuber/startled.png",
  talking: "pngtuber/talking.png",
  thinking: "pngtuber/thinking.png",
  shy: "pngtuber/shy.png"
};

function setState(state) {
  character.style.opacity = 0;
  setTimeout(() => {
    character.src = states[state];
    character.style.opacity = 1;
  }, 150);
}

function analyzeQuestion(text) {
  const flirtWords = ["รัก", "ชอบ", "แฟน", "คิดถึง", "จีบ", "น่ารัก"];

  if (flirtWords.some(w => text.includes(w))) {
    setState("shy");
    return;
  }

  if (text.length < 4) {
    setState("thinking");
    return;
  }

  setState("talking");
}

setState("idle");

/* =========================
   UI HELPERS
========================= */
function addMessage(sender, text) {
  const div = document.createElement("div");

  div.className = sender === "นิสิต" ? "user" : "bot";

  if (sender === "นิสิต") {
    div.innerText = `นิสิต: ${text}`;
  } else {
    div.innerHTML = `
      <div class="bot-name">ครูน้ำว้า 💖</div>
      <div class="bot-text"></div>
    `;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateLastBotMessage(text) {
  let last = chatBox.lastElementChild;
  if (!last || !last.classList.contains("bot")) return;

  last.innerHTML = `
    <div class="bot-name">ครูน้ำว้า 💖</div>
    <div class="bot-text typing">${text}</div>
  `;

  chatBox.scrollTop = chatBox.scrollHeight;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* =========================
   VOICE SYSTEM
========================= */
let voices = [];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);

  const vs = window.speechSynthesis.getVoices();
  const googleThai = vs.find(v =>
    v.name.includes("Google ภาษาไทย") || v.name.includes("Google Thai")
  );
  const localThai = vs.find(v => v.lang.includes("th-TH"));

  if (googleThai) u.voice = googleThai;
  else if (localThai) u.voice = localThai;

  u.lang = "th-TH";
  u.rate = 1.0;
  u.pitch = 1.2;

  window.speechSynthesis.speak(u);
}

window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
  console.log(
    "📋 Thai voices:",
    voices.filter(v => v.lang.includes("th")).map(v => v.name)
  );
};

voices = window.speechSynthesis.getVoices();

/* =========================
   CHAT FLOW
========================= */
sendButton.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("นิสิต", message);
  input.value = "";

  analyzeQuestion(message);

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    let text = data.reply || "";

    // ตัด prefix ออกก่อน
    let cleanText = text.replace("ครูน้ำว้า 💖\n", "");

    // 🎤 พูด
    speak(cleanText);

    // 🧱 สร้างบับเบิลบอทเปล่า
    addMessage("ครูน้ำว้า", "");

    // ⌨️ พิมพ์ไหลในบับเบิลเดียว
    let shown = "";
    for (let i = 0; i < cleanText.length; i++) {
      shown += cleanText[i];
      updateLastBotMessage(shown);
      await sleep(25);
    }

  } catch (err) {
    console.error("❌ Error:", err);
    updateLastBotMessage("ขอโทษนะ ตอนนี้ระบบมีปัญหานิดหน่อย");
  } finally {
    setState("idle");
  }
}
