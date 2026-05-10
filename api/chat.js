export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a logistics AI analyst. You ONLY respond with valid raw JSON. No markdown, no backticks, no explanation. Just the JSON object."
          },
          ...req.body.messages
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("Groq response error:", JSON.stringify(data));
      return res.status(500).json({ error: "Invalid Groq response", detail: data });
    }

    const text = data.choices[0].message.content;
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "API call failed", detail: err.message });
  }
}