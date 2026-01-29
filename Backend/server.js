import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 1. โหลดค่า Config จาก .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Front")));

// 3. ตรวจสอบ API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ อย่าลืมตั้งค่า GEMINI_API_KEY ในไฟล์ .env นะคะ!");
  process.exit(1);
}

/**
 * ฟังก์ชันเรียกใช้งาน Gemini 2.5 Pro
 */
async function callGemini(userMessage) {
  // ✅ ปรับใช้รุ่น 2.5 Pro ตามข้อมูลในหน้า Quota ของหนูเลยค่ะ
  const model = "gemini-2.5-pro"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { 
            text: `คุณคือ "ครูน้ำว้า" ครูสอนโปรแกรมมิ่งใจดี พูดจาน่ารัก มีคะ/ขา และชอบใช้อีโมจิ 💖 คำถาม: ${userMessage}` 
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("❌ API Error:", data.error?.message);
      throw new Error(data.error?.message || "ระบบ API ขัดข้อง");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ครูน้ำว้ายังไม่มีคำตอบให้ข้อนี้จ้า";
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    throw error;
  }
}

// 4. Route สำหรับรับข้อความ
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "พิมพ์อะไรมาหาครูหน่อยเร็ว 💖" });

    const text = await callGemini(message);
    
    // ตอบกลับพร้อมชื่อครู
    res.json({ reply: "ครูน้ำว้า 💖\n" + text });

  } catch (err) {
    res.json({ reply: "ครูน้ำว้า 🥲 ระบบขัดข้อง: " + err.message });
  }
});

// 5. เริ่มการทำงาน
app.listen(PORT, () => {
  console.log(`✅ ครูน้ำว้า (Gemini 2.5 Pro) พร้อมสอนแล้วที่ http://localhost:${PORT}`);
});