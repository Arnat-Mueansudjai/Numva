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
app.use(express.static(path.join(__dirname, "../Front")));

// ===== Gemini REST setup =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ยังไม่ได้ตั้ง GEMINI_API_KEY ใน .env");
  process.exit(1);
}

/**
 * ฟังก์ชันเรียกใช้งาน Gemini API
 * แก้ไข URL ให้ใช้ v1beta และโมเดล gemini-1.5-flash-latest
 */
async function callGemini(prompt) {
  // ใช้ v1beta และรุ่นล่าสุดเพื่อให้รองรับ API Key ใหม่ของคุณได้ดีที่สุด
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512
    }
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const rawText = await resp.text();

    if (!resp.ok) {
      console.error("❌ Google API Error Raw:", rawText);
      throw new Error(`API Error ${resp.status}`);
    }

    const data = JSON.parse(rawText);
    
    /**
     * ดึงคำตอบจากโครงสร้าง JSON ของ Gemini 1.5
     * โครงสร้างคือ: candidates[0].content.parts[0].text
     */
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ครูน้ำว้า 🤖 ไม่มีคำตอบกลับมาเลยจ้า";

    return text;

  } catch (error) {
    console.error("❌ callGemini Error:", error.message);
    throw error;
  }
}

// 🧠 Route แชต
app.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    console.log("📩 นักเรียนถาม =", userMessage);

    if (!userMessage) {
      return res.json({
        reply: "ครูน้ำว้า 😅 นักเรียนยังไม่ได้พิมพ์คำถามเลยนะ"
      });
    }

    const lower = userMessage.toLowerCase();

    // 👉 เช็ค Keyword พื้นฐาน (ครูน้ำว้าตอบเอง)
    if (
      lower.includes("for") ||
      lower.includes("for loop") ||
      lower.includes("ลูป") ||
      lower.includes("วนซ้ำ")
    ) {
      return res.json({
        reply: `นักเรียน 💖 
for loop คือการวนซ้ำคำสั่งเดิมหลาย ๆ รอบ 
ใช้เมื่อเรารู้จำนวนรอบล่วงหน้า 😊 

ตัวอย่าง: 
\`\`\`js
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`

อธิบายทีละบรรทัด: 
- let i = 0 → เริ่มนับจาก 0 
- i < 5 → ทำซ้ำจน i น้อยกว่า 5 
- i++ → เพิ่มค่า i ทีละ 1 

ผลลัพธ์: 0, 1, 2, 3, 4 

นักเรียนเข้าใจไหมเอ่ย 😆`
      });
    }

    if (lower.includes("git")) {
      return res.json({
        reply: `นักเรียน 💖 
Git คือระบบจัดการเวอร์ชันของโค้ด 

คำสั่งพื้นฐาน: 
\`\`\`bash
git init
git add .
git commit -m "first commit"
\`\`\`

นักเรียนอยากให้ครูน้ำว้าสอน branch ต่อไหม 😆`
      });
    }

    // 👉 ส่งเข้า Gemini AI
    const prompt = `
คุณคือ "ครูน้ำว้า" 💖 
นิสัย: ใจดี เป็นกันเอง พูดจาน่ารัก มีคะ/ขา 
บทบาท: ครูสอนโปรแกรมมิ่งสำหรับเด็กหรือมือใหม่
กติกา: อธิบายสั้น กระชับ เข้าใจง่าย และให้กำลังใจนักเรียนเสมอ

คำถามจากนักเรียน: ${userMessage}
`;

    const text = await callGemini(prompt);
    console.log("🤖 Gemini =", text);

    return res.json({
      reply: "ครูน้ำว้า 💖\n" + text
    });

  } catch (err) {
    console.error("❌ Gemini ERROR FULL =", err);
    return res.json({
      reply: "ครูน้ำว้า 🥲 ขอโทษนะนักเรียน ระบบ AI มีปัญหานิดหน่อย\n\nรายละเอียด error: " + err.message
    });
  }
});

// ▶ start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("🔑 KEY loaded =", process.env.GEMINI_API_KEY ? "YES" : "NO");
});