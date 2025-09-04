# Prompt → Blog Generator (FlocCare Assignment)

A minimal full‑stack web app where a user enters a prompt and gets a ~1000‑word, well‑formatted blog generated on the page.

- **Frontend**: HTML, CSS, vanilla JS
- **Backend**: Node.js (Express)
- **LLM**: Google **Gemini 1.5 Flash** (free tier via Google AI Studio)
- **Formatting**: Markdown rendered with `marked` on the client
- **UX**: Clean, responsive UI; copy & download actions; word count; rate limiting

> ✅ The assignment asked to use a **free** model via API and render the blog on the page. This project fulfills that.

---

## Quick Start (Local)

1. **Clone** this project or unzip it somewhere.
2. Create `.env` from the example:
   ```bash
   cp .env.example .env
   ```
3. Put your **free** Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
   Get a key from https://aistudio.google.com/ — the free tier is sufficient.
4. Install dependencies & run:
   ```bash
   npm install
   npm run dev
   ```
5. Open: http://localhost:3000

---

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import into **Vercel** → Framework preset: **Other**.
3. Set environment variable in Vercel Project Settings → **GEMINI_API_KEY**.
4. Deploy. That’s it.

---

## Notes for Reviewers

- The backend calls the Gemini REST endpoint:
  - `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=...`
- The prompt enforces structure (H1–H3, intro, sections, conclusion) and Markdown output.
- Target length is clamped 800–1400 words; default 1000.
- Rate limit: 30 requests/hour/IP.
- The UI shows status, word count, and provides **Copy** and **Download .md**.

---

## Folder Structure

```
floccare-blog-generator/
  public/
    index.html
    styles.css
    app.js
  server.js
  package.json
  .env.example
  README.md
```

---

## Screenshots (if needed)

- Landing with form (left) and blog output (right on desktop)
- Output shows Markdown headings, lists, and paragraphs
- Actions: Copy to clipboard, Download .md

---

## Alternatives

If you prefer a fully open‑source model provider, swap the `generate` call to:
- **Hugging Face Inference API** (e.g., `mistralai/Mixtral-8x7B-Instruct-v0.1`) — also free tier with token
- **OpenRouter** (some models are free at times)
Just change `/api/generate` to call the chosen API and pass your key via `.env`.
