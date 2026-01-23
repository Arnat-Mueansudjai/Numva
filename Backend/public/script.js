async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage("นักเรียน", message);
  input.value = "";

  setTuberTalking(true);

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  let text = data.reply;
  let shown = "";

  for (let i = 0; i < text.length; i++) {
    shown += text[i];
    updateLastBotMessage(shown);
    await sleep(25);
  }

  setTuberTalking(false);
}

function addMessage(sender, text) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = sender === "นักเรียน" ? "user" : "bot";
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

  last.innerText = "ครูน้ำว้า: " + text;
  box.scrollTop = box.scrollHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🧠 PNGTuber logic
function setTuberTalking(isTalking) {
  const tuber = document.getElementById("tuber");
  tuber.src = isTalking
    ? "pngtuber/talk.png"
    : "pngtuber/idle.png";
}
