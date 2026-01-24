import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../Front")));

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ยังไม่ได้ตั้ง GEMINI_API_KEY ใน .env");
  process.exit(1);
}

async function callGemini(prompt) {
  // ✅ เปลี่ยนชื่อโมเดลเป็น gemini-1.5-flash-latest (ระบุ -latest ต่อท้าย)
  // และใช้ v1beta เหมือนเดิม
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
      console.error("❌ Google API Error Detail:", rawText);
      throw new Error(`API Error ${resp.status}`);
    }

    const data = JSON.parse(rawText);
    
    // ดึงคำตอบจากโครงสร้าง JSON ของ Gemini 1.5
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ครูน้ำว้ายังไม่มีคำตอบเลยจ้า";

  } catch (error) {
    console.error("❌ callGemini Error:", error.message);
    throw error;
  }
}

// Route แชต
app.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    if (!userMessage) return res.json({ reply: "ครูน้ำว้า 😅 นักเรียนถามอะไรเอ่ย?" });

    // ส่งให้ AI ตอบ
    const prompt = `คุณคือ "ครูน้ำว้า" ครูสอนโปรแกรมมิ่งใจดี พูดจาน่ารัก มีคะ/ขา\nคำถาม: ${userMessage}`;
    const text = await callGemini(prompt);
    
    return res.json({ reply: "ครูน้ำว้า 💖\n" + text });

  } catch (err) {
    return res.json({ reply: "ครูน้ำว้า 🥲 ระบบขัดข้อง: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("🔑 KEY loaded =", process.env.GEMINI_API_KEY ? "YES" : "NO");
});