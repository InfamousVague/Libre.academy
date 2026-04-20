import { codeToHtml } from "shiki";

/// A very small, purpose-built Markdown renderer. We don't need the whole
/// CommonMark spec for V1 — just headings, paragraphs, inline code, and
/// fenced code blocks (which we pass through Shiki).
///
/// When lesson content gets richer we can swap in `markdown-it` or similar.

const SHIKI_THEME = "github-dark";

export async function renderMarkdown(source: string): Promise<string> {
  const lines = source.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block (``` optionally followed by language)
    const fence = /^```(\w+)?\s*$/.exec(line);
    if (fence) {
      const language = fence[1] ?? "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const code = codeLines.join("\n");
      try {
        const shikiHtml = await codeToHtml(code, {
          lang: language,
          theme: SHIKI_THEME,
        });
        html += `<div class="kata-code-block">${shikiHtml}</div>`;
      } catch {
        // Unknown language — fall back to plain pre.
        html += `<pre class="kata-code-plain">${escapeHtml(code)}</pre>`;
      }
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — consume contiguous non-empty, non-fence, non-heading lines.
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    html += `<p>${inline(paraLines.join(" "))}</p>`;
  }

  return html;
}

function inline(text: string): string {
  // Escape first, then apply inline `code` runs.
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Emphasis & strong — simple non-nested forms.
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
