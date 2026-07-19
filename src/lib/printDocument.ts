export type PrintableSection = {
  heading: string;
  lines: string[];
};

export type PrintableDocument = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  sections: PrintableSection[];
  footer: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Opens a branded print preview in the browser. The native print dialog keeps
 * the visual hierarchy intact and lets the user choose "Save as PDF" locally.
 */
export function openStyledPrintPreview(document: PrintableDocument) {
  if (typeof window === 'undefined') return false;
  const preview = window.open('', '_blank');
  if (!preview) return false;

  const sections = document.sections
    .map(
      (section) => `
        <section class="card">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        </section>`,
    )
    .join('');

  preview.opener = null;
  preview.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(document.title)} | HealthBridge</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body { background: #ece7df; color: #0f172a; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; margin: 0; padding: 32px 18px; }
          main { background: #fffaf2; border: 1px solid #cbd5e1; border-radius: 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, .14); margin: 0 auto; max-width: 700px; overflow: hidden; }
          header { background: linear-gradient(118deg, #050c1c, #16214a); color: #fff; padding: 34px; position: relative; }
          header::after { background: #2563eb; border-radius: 999px; content: ''; height: 132px; opacity: .28; position: absolute; right: -34px; top: -48px; width: 132px; }
          .brand { align-items: center; display: flex; font-size: 13px; font-weight: 700; gap: 9px; letter-spacing: .06em; position: relative; text-transform: uppercase; z-index: 1; }
          .brand-mark { align-items: center; background: #fff; border-radius: 9px; color: #123378; display: inline-flex; font-family: Georgia, serif; font-size: 19px; font-weight: 700; height: 31px; justify-content: center; width: 31px; }
          .eyebrow { color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: .16em; margin: 28px 0 0; position: relative; text-transform: uppercase; z-index: 1; }
          h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 35px; letter-spacing: -.03em; line-height: 1.05; margin: 8px 0 0; max-width: 520px; position: relative; z-index: 1; }
          .subtitle { color: #dbeafe; font-size: 14px; margin: 12px 0 0; max-width: 530px; position: relative; z-index: 1; }
          .content { padding: 24px; }
          .card { background: #fff; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 2px 8px rgba(15, 23, 42, .05); break-inside: avoid; margin-top: 14px; padding: 16px 18px; }
          h2 { color: #1d4ed8; font-size: 11px; letter-spacing: .12em; margin: 0 0 9px; text-transform: uppercase; }
          p { font-size: 14px; margin: 7px 0; white-space: pre-wrap; }
          footer { border-top: 1px solid #cbd5e1; color: #475569; font-size: 11px; margin-top: 20px; padding-top: 14px; }
          .print-tip { color: #475569; font-size: 12px; margin: 16px 0 0; text-align: center; }
          @page { margin: 14mm; size: A4; }
          @media print {
            body { background: #fff; padding: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            main { border-radius: 0; box-shadow: none; max-width: none; }
            .print-tip { display: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <div class="brand"><span class="brand-mark">H</span> HealthBridge</div>
            <p class="eyebrow">${escapeHtml(document.eyebrow)}</p>
            <h1>${escapeHtml(document.title)}</h1>
            ${document.subtitle ? `<p class="subtitle">${escapeHtml(document.subtitle)}</p>` : ''}
          </header>
          <div class="content">
            ${sections}
            <footer>${escapeHtml(document.footer)}</footer>
            <p class="print-tip">In the print dialog, choose “Save as PDF” to keep this styled card.</p>
          </div>
        </main>
        <script>window.onload = () => window.setTimeout(() => window.print(), 250);</script>
      </body>
    </html>`);
  preview.document.close();
  return true;
}
