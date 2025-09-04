const form = document.getElementById("genForm");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const wordCountEl = document.getElementById("wordCount");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

let lastMarkdown = "";

function countWords(text) {
  return (text.trim().match(/\b\w+\b/g) || []).length;
}

function setBusy(busy) {
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = busy;
  copyBtn.disabled = busy || !lastMarkdown;
  downloadBtn.disabled = busy || !lastMarkdown;
  statusEl.textContent = busy ? "Generating your blog… This typically takes a few seconds." : "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = document.getElementById("topic").value.trim();
  const tone = document.getElementById("tone").value;
  const audience = document.getElementById("audience").value.trim();
  const outline = document.getElementById("outline").value.trim();
  const words = parseInt(document.getElementById("words").value || "1000", 10);

  if (!topic || topic.length < 3) {
    statusEl.textContent = "Please enter a valid topic (min 3 characters).";
    return;
  }

  setBusy(true);
  resultEl.innerHTML = "";
  wordCountEl.textContent = "";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, tone, audience, outline, words })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Generation failed");
    }

    lastMarkdown = (data.markdown || "").trim();
    // Render Markdown to HTML using marked (loaded from CDN in index.html)
    resultEl.innerHTML = marked.parse(lastMarkdown);
    const wc = countWords(lastMarkdown);
    wordCountEl.textContent = `Word count (approx.): ${wc}`;

    copyBtn.disabled = !lastMarkdown;
    downloadBtn.disabled = !lastMarkdown;
    statusEl.textContent = "Done ✅";
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(false);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!lastMarkdown) return;
  try {
    await navigator.clipboard.writeText(lastMarkdown);
    statusEl.textContent = "Copied blog to clipboard ✔️";
  } catch {
    statusEl.textContent = "Copy failed — you can select and copy manually.";
  }
});

downloadBtn.addEventListener("click", () => {
  if (!lastMarkdown) return;
  const blob = new Blob([lastMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blog.md";
  a.click();
  URL.revokeObjectURL(url);
});
