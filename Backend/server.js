import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3000;

// ===== path สำหรับ Front =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../Front")));

// ===== Gemini setup =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ยังไม่ได้ตั้ง GEMINI_API_KEY ใน .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 🧠 Route แชต
app.post("/chat", async (req, res) => {
  try {
    console.log("📦 body =", req.body);

    const userMessage = (req.body.message || "").trim();
    console.log("📩 นักเรียนถาม =", userMessage);

    if (!userMessage) {
      return res.json({
        reply: "ครูน้ำว้า 😅 นักเรียนยังไม่ได้พิมพ์คำถามเลยนะ"
      });
    }

    const lower = userMessage.toLowerCase();

    // 👉 for loop
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

ผลลัพธ์:  
0  
1  
2  
3  
4  

นักเรียนเข้าใจไหมเอ่ย 😆`
      });
    }

    // 👉 git
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

- git init → เริ่ม repo  
- git add . → เตรียมไฟล์  
- git commit → บันทึกเวอร์ชัน  

นักเรียนอยากให้ครูน้ำว้าสอน branch ต่อไหม 😆`
      });
    }

    // 👉 fallback → ส่งเข้า Gemini
    const prompt = `
คุณคือ "ครูน้ำว้า" 💖  
นิสัย: ใจดี เป็นกันเอง  
พูดภาษาไทย  
อธิบายให้มือใหม่เข้าใจง่าย  
ตอบสั้น กระชับ แต่เข้าใจง่าย  

คำถามนักเรียน: ${userMessage}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🤖 Gemini =", text);

    return res.json({
      reply: "ครูน้ำว้า 💖\n" + text
    });

  } catch (err) {
    console.error("❌ ERROR:", err);

    return res.status(500).json({
      reply: "ครูน้ำว้า 🥲 ขอโทษนะนักเรียน ระบบ AI มีปัญหานิดหน่อย"
    });
  }
});

// ▶ start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("🔑 KEY loaded =", process.env.GEMINI_API_KEY ? "YES" : "NO");
});
