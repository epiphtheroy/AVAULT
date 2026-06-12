// Compact markdown → HTML for column bodies (headers, bold/italic, links, lists, blockquotes).
// Content originates from the editor-reviewed pipeline, not arbitrary users.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener" target="_blank">$1</a>');
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ol" | "ul"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      const text = para.join(" ");
      // Smart Brevity signpost promotion: a block opening with a bolded 1-5 word
      // lead that ends in ":" or "—" becomes a semantic <h2> (extraction signal)
      // followed by the rest of the block as the paragraph.
      const sp = text.match(/^\*\*([^*]{2,60}?[:—])\*\*\s*(.*)$/);
      if (sp && sp[1].trim().split(/\s+/).length <= 5) {
        out.push(`<h2 class="sp">${inline(esc(sp[1].replace(/[:—]\s*$/, "")))}</h2>`);
        if (sp[2].trim()) out.push(`<p>${inline(esc(sp[2]))}</p>`);
      } else {
        out.push(`<p>${inline(esc(text))}</p>`);
      }
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(esc(i))}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) { flushPara(); flushList(); continue; }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = Math.min(Math.max(h[1].length, 2), 3); // normalize to h2/h3
      out.push(`<h${level}>${inline(esc(h[2]))}</h${level}>`);
      continue;
    }

    if (line.startsWith(">")) {
      flushPara(); flushList();
      out.push(`<blockquote><p>${inline(esc(line.replace(/^>\s?/, "")))}</p></blockquote>`);
      continue;
    }

    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push(ol[1]);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(ul[1]);
      continue;
    }

    if (list) flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return out.join("\n");
}
