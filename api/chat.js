export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a logistics AI analyst. Always respond with ONLY a raw JSON object. No markdown, no backticks, no extra text before or after. Just the JSON."
          },
          ...req.body.messages
        ]
      })
    });

    const groqText = await groqRes.text();

    if (!groqRes.ok) {
      console.error("Groq API error:", groqRes.status, groqText);
      return res.status(500).json({ error: "Groq API failed", detail: groqText });
    }

    const groqData = JSON.parse(groqText);
    const text = groqData.choices?.[0]?.message?.content || "";

    res.status(200).json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.error("Handler error:", err.message);
    res.status(500).json({ error: err.message });
  }
}