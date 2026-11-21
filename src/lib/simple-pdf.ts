/**
 * A tiny PDF writer for text-and-rules documents (the taper schedule).
 *
 * No dependencies: it writes PDF 1.4 by hand with the standard Helvetica
 * fonts in WinAnsi encoding, so a schedule can download as a real file
 * instead of going through the browser's print dialog. Units are points
 * (1/72 inch) with the origin at the top-left of a US Letter page.
 */

export const PAGE_W = 612;
export const PAGE_H = 792;

type Op =
  | { t: 'text'; x: number; y: number; size: number; bold: boolean; text: string; color: RGB }
  | { t: 'rect'; x: number; y: number; w: number; h: number; color: RGB }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; color: RGB; width: number };

export type RGB = [number, number, number];

export class PdfDoc {
  private pages: Op[][] = [[]];

  get page(): number {
    return this.pages.length;
  }

  addPage() {
    this.pages.push([]);
  }

  text(x: number, y: number, text: string, opts: { size?: number; bold?: boolean; color?: RGB } = {}) {
    this.pages[this.pages.length - 1].push({
      t: 'text',
      x,
      y,
      size: opts.size ?? 10,
      bold: opts.bold ?? false,
      text,
      color: opts.color ?? [0.15, 0.13, 0.12],
    });
  }

  rect(x: number, y: number, w: number, h: number, color: RGB) {
    this.pages[this.pages.length - 1].push({ t: 'rect', x, y, w, h, color });
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB = [0.8, 0.77, 0.72], width = 0.75) {
    this.pages[this.pages.length - 1].push({ t: 'line', x1, y1, x2, y2, color, width });
  }

  /** Rough Helvetica width, good enough for wrapping. */
  static width(text: string, size: number): number {
    return text.length * size * 0.52;
  }

  /** Split text into lines that fit `maxW` points at `size`. */
  static wrap(text: string, size: number, maxW: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (PdfDoc.width(next, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  toBytes(): Uint8Array<ArrayBuffer> {
    const chunks: string[] = [];
    const offsets: number[] = [];
    let length = 0;
    const push = (s: string) => {
      chunks.push(s);
      length += s.length; // every character is one byte (WinAnsi)
    };
    const obj = (n: number, body: string) => {
      offsets[n] = length;
      push(`${n} 0 obj\n${body}\nendobj\n`);
    };

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const pageCount = this.pages.length;
    // 1 catalog, 2 pages, 3 font, 4 bold font, then per page: page + content
    const kids = Array.from({ length: pageCount }, (_, i) => `${5 + i * 2} 0 R`).join(' ');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
    obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    this.pages.forEach((ops, i) => {
      // `{pages}` in any text becomes the page count, for "Page 2 of 3".
      const content = ops
        .map((op) => (op.t === 'text' ? { ...op, text: op.text.replaceAll('{pages}', String(pageCount)) } : op))
        .map(renderOp)
        .join('\n');
      const pageN = 5 + i * 2;
      obj(
        pageN,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageN + 1} 0 R >>`,
      );
      obj(pageN + 1, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });
    const xrefAt = length;
    const total = 5 + pageCount * 2;
    let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let n = 1; n < total; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
    push(xref);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

    const all = chunks.join('');
    const bytes = new Uint8Array(new ArrayBuffer(all.length));
    for (let i = 0; i < all.length; i++) bytes[i] = all.charCodeAt(i) & 0xff;
    return bytes;
  }
}

const f = (n: number) => (Math.round(n * 100) / 100).toString();
const rgb = (c: RGB) => c.map(f).join(' ');

function renderOp(op: Op): string {
  if (op.t === 'rect') {
    return `${rgb(op.color)} rg ${f(op.x)} ${f(PAGE_H - op.y - op.h)} ${f(op.w)} ${f(op.h)} re f`;
  }
  if (op.t === 'line') {
    return `${rgb(op.color)} RG ${f(op.width)} w ${f(op.x1)} ${f(PAGE_H - op.y1)} m ${f(op.x2)} ${f(PAGE_H - op.y2)} l S`;
  }
  return `BT ${rgb(op.color)} rg /${op.bold ? 'F2' : 'F1'} ${f(op.size)} Tf ${f(op.x)} ${f(PAGE_H - op.y)} Td (${pdfString(op.text)}) Tj ET`;
}

/** WinAnsi-encode and escape a string for a PDF text object. */
export function pdfString(text: string): string {
  const map: Record<string, string> = {
    '–': '\x96',
    '—': '\x97',
    '‘': '\x91',
    '’': '\x92',
    '“': '\x93',
    '”': '\x94',
    '•': '\x95',
    '≈': '~',
    '→': '->',
    '−': '-',
    ' ': ' ',
  };
  let out = '';
  for (const ch of text) {
    let c = map[ch] ?? ch;
    if (c.length === 1 && c.charCodeAt(0) > 0xff) c = '?';
    out += c.replace(/[\\()]/g, (m) => `\\${m}`);
  }
  return out;
}

/** Hand the bytes to the browser as a file download. */
export function downloadPdf(bytes: Uint8Array<ArrayBuffer>, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
