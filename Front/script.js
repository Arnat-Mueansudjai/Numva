// เก็บรายชื่อเสียงไว้ในตัวแปร Global เพื่อให้เรียกใช้ง่ายขึ้น
let voices = [];

/**
 * ฟังก์ชันหลักในการส่งข้อความ
 */
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage("นิสิต", message);
  input.value = "";

  setTuberTalking(true);

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    let text = data.reply;

    // ระบบเสียง: สั่งให้พูดเฉพาะเนื้อหาคำตอบ
    const speakText = text.replace("ครูน้ำว้า 💖\n", "");
    speak(speakText);

    let shown = "";
    for (let i = 0; i < text.length; i++) {
      shown += text[i];
      updateLastBotMessage(shown);
      await sleep(25);
    }
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err);
  } finally {
    setTuberTalking(false);
  }
}

/**
 * ✅ ฟังก์ชันจัดการเสียงพูด (ฉบับปรับปรุง)
 */
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // ดึงรายชื่อเสียงทั้งหมด
  const voices = window.speechSynthesis.getVoices();
  
  // 🎯 บังคับเลือก "Google ภาษาไทย" ซึ่งเป็นเสียงออนไลน์ของ Chrome ที่ชัดมาก
  const googleThai = voices.find(v => v.name.includes('Google ภาษาไทย') || v.name.includes('Google Thai'));
  const localThai = voices.find(v => v.lang.includes('th-TH'));

  if (googleThai) {
    utterance.voice = googleThai;
  } else if (localThai) {
    utterance.voice = localThai;
  }

  utterance.lang = 'th-TH';
  utterance.rate = 1.0;
  utterance.pitch = 1.2;
  window.speechSynthesis.speak(utterance);
}
function addMessage(sender, text) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = sender === "นิสิต" ? "user" : "bot";
  div.innerText = `${sender}: ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function updateLastBotMessage(text) {
  const box = document.getElementById("chat-box");
  let last = box.lastChild;
  if (!last || !last.classList.contains("bot")) {
    last = document.createElement("div");
    last.className = "bot";
    box.appendChild(last);
  }
  last.innerText = text; 
  box.scrollTop = box.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setTuberTalking(isTalking) {
  const tuber = document.getElementById("tuber");
  if (tuber) {
    tuber.src = isTalking ? "pngtuber/talk.png" : "pngtuber/idle.png";
  }
}

/**
 * ✅ บังคับให้โหลดรายชื่อเสียงทันทีเมื่อเปิดเว็บ
 */
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
  console.log("📋 รายชื่อเสียงที่โหลดแล้ว:", voices.filter(v => v.lang.includes('th')).map(v => v.name));
};

// เรียกครั้งแรกเผื่อบาง Browser ไม่รองรับ event onvoiceschanged
voices = window.speechSynthesis.getVoices();