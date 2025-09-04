import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Simple rate limiter: 30 requests per hour per IP
const rateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60 * 60,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ error: "Rate limit exceeded. Try again later." });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY is not set. Set it in .env");
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

function buildPrompt({ topic, tone, audience, outline, words }) {
  return `You are a professional blogger.
Write a well-structured, engaging blog post of approximately ${words} words.
Topic: ${topic}
Intended audience: ${audience || "general readers"}
Desired tone/style: ${tone || "informative and friendly"}
If an outline is provided, follow it closely.

Requirements:
- Use clear headings (H1, H2, H3), short paragraphs, and bullet lists where helpful.
- Include an introduction, 4–6 main sections, and a conclusion.
- Avoid fluff, ensure factual accuracy, and keep the flow natural.
- Use Markdown formatting only (no HTML tags).
- Do NOT include a preface like "Here is the blog post"; output ONLY the blog content.

${outline ? `Outline:\n${outline}` : ""}`;
}

app.post("/api/generate", async (req, res) => {
  try {
    const { topic, tone, audience, outline, words } = req.body || {};
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return res.status(400).json({ error: "Please provide a valid topic/prompt (min 3 characters)." });
    }

    const targetWords = Math.max(800, Math.min(1400, Number(words) || 1000)); // clamp 800–1400

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
      return res.status(r.status).json({ error: "Gemini API request failed.", details: t });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    if (!text) {
      return res.status(502).json({ error: "Empty response from model." });
    }

    res.json({ markdown: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: String(err) });
  }
});

// Fallback to index.html for root
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
