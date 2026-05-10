import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message } = req.body;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });

    return res.status(200).json({
      reply:
        completion.choices[0].message.content,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}