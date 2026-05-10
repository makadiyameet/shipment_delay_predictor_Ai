import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = "YOUR_GROQ_API_KEY"; // paste your key here

app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: req.body.messages
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "API call failed" });
  }
});

app.listen(3001, () => console.log("✓ Proxy running on http://localhost:3001"));