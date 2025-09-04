import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

function buildPrompt({ topic, tone, audience, outline, words }) {
  return `You are a professional blogger.\nWrite a well-structured, engaging blog post of approximately ${words} words.\nTopic: ${topic}\nIntended audience: ${audience || "general readers"}\nDesired tone/style: ${tone || "informative and friendly"}\nIf an outline is provided, follow it closely.\n\nRequirements:\n- Use clear headings (H1, H2, H3), short paragraphs, and bullet lists where helpful.\n- Include an introduction, 4–6 main sections, and a conclusion.\n- Avoid fluff, ensure factual accuracy, and keep the flow natural.\n- Use Markdown formatting only (no HTML tags).\n- Do NOT include a preface like "Here is the blog post"; output ONLY the blog content.\n\n${outline ? `Outline:\n${outline}` : ""}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { topic, tone, audience, outline, words } = req.body || {};
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      res.status(400).json({ error: "Please provide a valid topic/prompt (min 3 characters)." });
      return;
    }

    const targetWords = Math.max(800, Math.min(1400, Number(words) || 1000));
    const prompt = buildPrompt({ topic, tone, audience, outline, words: targetWords });
    const url = `${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY || "")}`;
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text();
      res.status(r.status).json({ error: "Gemini API request failed.", details: t });
      return;
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    if (!text) {
      res.status(502).json({ error: "Empty response from model." });
      return;
    }

    res.json({ markdown: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: String(err) });
  }
}
