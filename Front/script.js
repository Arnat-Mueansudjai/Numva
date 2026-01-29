/* =========================
   DOM REFERENCES (Updated ID)
========================= */
const character = document.getElementById("ai-character");
const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

const states = {
  idle: "pngtuber/idle.png",
  talking: "pngtuber/talk.png",
  thinking: "pngtuber/thinking.png",
  shy: "pngtuber/shy.png"
};

function setState(state) {
  if (character && states[state]) {
    character.src = states[state];
  }
}

function analyzeQuestion(text) {
  const flirtWords = ["รัก", "ชอบ", "แฟน", "คิดถึง", "จีบ", "น่ารัก"];
  if (flirtWords.some(w => text.includes(w))) {
    setState("shy");
    return;
  }
  setState("talking");
}

/* =========================
   VOICE SYSTEM
========================= */
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const thaiVoice = voices.find(v => v.lang.includes('th-TH'));
  
  if (thaiVoice) utterance.voice = thaiVoice;
  utterance.lang = 'th-TH';
  utterance.rate = 1.1;
  utterance.pitch = 1.2;
  window.speechSynthesis.speak(utterance);
}

/* =========================
   CHAT FLOW
========================= */
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
    let text = data.reply;

    // ระบบเสียง: ตัดชื่อออกก่อนพูด
    const speakText = text.replace("ครูน้ำว้า 💖\n", "");
    speak(speakText);

    addMessage("ครูน้ำว้า", "");

    let shown = "";
    for (let char of text) {
      shown += char;
      updateLastBotMessage(shown);
      await new Promise(r => setTimeout(r, 25)); // Typewriter effect
    }
  } catch (err) {
    updateLastBotMessage("ขอโทษทีค่ะ ระบบมีปัญหาเล็กน้อย");
  } finally {
    setState("idle");
  }
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "นิสิต" ? "text-right mb-4" : "text-left mb-4";
  
  // สร้าง Bubble ที่เข้ากับ Tailwind Dark Theme ของคุณ
  const innerClass = sender === "นิสิต" 
    ? "inline-block bg-[#1f1f1f] text-white p-4 rounded-2xl rounded-tr-none text-lg max-w-[80%]"
    : "inline-block bg-transparent text-gray-200 p-4 text-xl leading-relaxed max-w-[90%] font-light";

  div.innerHTML = `<div class="${innerClass}">${text}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function updateLastBotMessage(text) {
  const last = chatBox.lastElementChild;
  if (last) {
    const bubble = last.querySelector('div');
    if (bubble) bubble.innerText = text;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.onclick = sendMessage;