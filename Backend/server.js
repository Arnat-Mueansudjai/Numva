import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// โหลดค่าจากไฟล์ .env
dotenv.config();

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ตั้งค่า Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Front")));

// 1. ตรวจสอบ API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ยังไม่ได้ตั้ง GEMINI_API_KEY ใน .env");
  process.exit(1);
}

/**
 * 2. ฟังก์ชันเรียกใช้งาน Gemini API
 * ปรับปรุงโครงสร้าง JSON เพื่อรองรับ Gemini 2.0 Flash และป้องกัน Error 400
 */
async function callGemini(prompt) {
  // ใช้ v1beta และโมเดล gemini-2.0-flash ตามสิทธิ์ที่คุณได้รับ
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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

    const data = await resp.json();

    if (!resp.ok) {
      // แสดงรายละเอียด Error ใน Terminal เพื่อการ Debug
      console.error("❌ Google API Error Detail:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Bad Request");
    }

    // ดึงเนื้อหาคำตอบจาก AI
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "ครูน้ำว้ายังไม่มีคำตอบเลยจ้า";

  } catch (error) {
    console.error("❌ callGemini Error:", error.message);
    throw error;
  }
}

/**
 * 3. Route สำหรับรับข้อความแชทจาก Frontend
 */
app.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    if (!userMessage) return res.json({ reply: "ครูน้ำว้า 😅 นักเรียนถามอะไรเอ่ย?" });

    // กำหนดบุคลิกให้ "ครูน้ำว้า"
    const prompt = `คุณคือ "ครูน้ำว้า" ครูสอนโปรแกรมมิ่งใจดี พูดจาน่ารัก มีคะ/ขา และชอบใช้อีโมจิ 💖\nคำถาม: ${userMessage}`;
    const text = await callGemini(prompt);
    
    // ส่งคำตอบกลับพร้อมหัวข้อ (Prefix) เพื่อให้ Frontend นำไปจัดการต่อ
    return res.json({ reply: "ครูน้ำว้า 💖\n" + text });

  } catch (err) {
    return res.json({ reply: "ครูน้ำว้า 🥲 ระบบขัดข้อง: " + err.message });
  }
});

/**
 * 4. เริ่มต้นการทำงานของ Server
 */
app.listen(PORT, () => {
  console.log(`✅ ครูน้ำว้าพร้อมสอนแล้วที่ http://localhost:${PORT}`);
  console.log("🔑 API Key Status:", process.env.GEMINI_API_KEY ? "Loaded" : "Not Found");
});