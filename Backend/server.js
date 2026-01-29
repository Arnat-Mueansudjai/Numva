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

// 1. ตรวจสอบ API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ อย่าลืมตั้งค่า GEMINI_API_KEY ในไฟล์ .env นะคะ!");
  process.exit(1);
}

// 2. ฟังก์ชันตรวจสอบรายชื่อโมเดล (ใช้เพื่อยืนยันสิทธิ์)
async function listAvailableModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("------------------------------------------");
    console.log("📋 รายชื่อโมเดลที่คุณใช้งานได้ตอนนี้:");
    data.models?.forEach(m => console.log(`- ${m.name}`));
    console.log("------------------------------------------");
  } catch (err) {
    console.error("❌ ดึงรายชื่อโมเดลไม่สำเร็จ:", err.message);
  }
}

// 3. ฟังก์ชันเรียกใช้งาน Gemini API (ปรับปรุงเพื่อรุ่น 2.0)
async function callGemini(prompt) {
  // ✅ เปลี่ยนมาใช้ gemini-2.0-flash ตามที่ระบบระบุว่าใช้ได้
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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
      console.error("❌ Google API Error:", JSON.stringify(data));
      throw new Error(`API Error ${resp.status}`);
    }

    // ดึงคำตอบจากโครงสร้าง JSON
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ครูน้ำว้ายังไม่มีคำตอบเลยจ้า";

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    throw error;
  }
}

// 4. Route สำหรับระบบแชท
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "พิมพ์อะไรมาหาครูหน่อยเร็ว 💖" });

    // กำหนด Prompt และบุคลิกให้ครูน้ำว้า
    const prompt = `คุณคือ "ครูน้ำว้า" ครูสอนโปรแกรมมิ่งใจดี พูดจาน่ารัก มีคะ/ขา\nคำถาม: ${userMessage}`;
    const text = await callGemini(prompt);
    
    // ตอบกลับพร้อมชื่อครู
    res.json({ reply: "ครูน้ำว้า 💖\n" + text });

  } catch (err) {
    res.json({ reply: "ครูน้ำว้า 🥲 ระบบขัดข้อง: " + err.message });
  }
});

// 5. เริ่มต้นการทำงานของ Server
app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("🔑 KEY loaded =", process.env.GEMINI_API_KEY ? "YES" : "NO");
  
  // ตรวจสอบโมเดลที่ใช้งานได้ทันทีเมื่อเริ่มโปรแกรม
  await listAvailableModels();
});