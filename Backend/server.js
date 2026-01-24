import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3001;

// ===== path สำหรับ Front =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
// ปรับ path ให้ตรงกับโครงสร้างโฟลเดอร์ของคุณ (Front อยู่ระดับเดียวกับ Backend)
app.use(express.static(path.join(__dirname, "../Front")));

// ===== Gemini REST setup =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ยังไม่ได้ตั้ง GEMINI_API_KEY ใน .env");
  process.exit(1);
}

// ✅ เปลี่ยน URL เป็น gemini-1.5-flash-latest (ตัวนี้จะช่วยแก้ 404 ได้ดีที่สุด)
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const rawText = await resp.text();

    if (!resp.ok) {
      console.error("❌ API Error Detail:", rawText);
      throw new Error(`API Error ${resp.status}`);
    }

    const data = JSON.parse(rawText);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ครูน้ำว้ายังไม่มีคำตอบเลยจ้า";

  } catch (error) {
    console.error("❌ callGemini Error:", error.message);
    throw error;
  }
}

// 🧠 Route แชต
app.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    
    if (!userMessage) {
      return res.json({ reply: "ครูน้ำว้า 😅 นักเรียนยังไม่ได้พิมพ์คำถามเลยนะ" });
    }

    // 👉 เช็ค Keyword (ถ้ามีคำว่า for, loop, วนซ้ำ)
    const lower = userMessage.toLowerCase();
    if (lower.includes("for") || lower.includes("loop") || lower.includes("วนซ้ำ")) {
        return res.json({
            reply: "นักเรียน 💖\nfor loop คือการวนซ้ำคำสั่งเดิมหลาย ๆ รอบจ้า\n\nตัวอย่าง:\n```js\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n```"
        });
    }

    // 👉 ส่งเข้า AI
    const prompt = `คุณคือ "ครูน้ำว้า" ครูสอนโปรแกรมมิ่งใจดี พูดจาน่ารัก มีคะ/ขา ตอบคำถามนักเรียนสั้นๆ เข้าใจง่าย\nคำถาม: ${userMessage}`;
    const text = await callGemini(prompt);
    
    return res.json({ reply: "ครูน้ำว้า 💖\n" + text });

  } catch (err) {
    return res.json({ reply: "ครูน้ำว้า 🥲 ระบบ AI มีปัญหาจ้า: " + err.message });
  }
});

// ▶ start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("🔑 KEY loaded =", process.env.GEMINI_API_KEY ? "YES" : "NO");
});