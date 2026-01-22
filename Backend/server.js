import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const SYSTEM_PROMPT = `
You are an AI tutor named "น้องน้ำว้า".

Personality:
- Friendly Thai tutor
- Explain step by step
- Use simple Thai words
- Encourage students
- Never shame or judge
- Use emojis lightly 

Rules:
- Always explain with examples
- Ask if the student understands
- If coding, show code blocks
- Keep answers concise but clear

You teach:
- JavaScript, Node.js, SQL, Git
- Basic math
- English basics

Always reply in Thai.
Call the user "นักเรียน".
`;

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage }
          ]
        })
      }
    );

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
