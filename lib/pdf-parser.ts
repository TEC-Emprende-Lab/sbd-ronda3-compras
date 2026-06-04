import type { ParsedInvoice } from "./xml-parser";

/**
 * Extrae datos de facturas electrónicas costarricenses en formato PDF.
 * Usa PDF.js (Mozilla) — corre en el navegador, sin API key ni servidor.
 *
 * Patrones buscados en el texto del PDF:
 *  - Emisor / Nombre del emisor → proveedor
 *  - Número Consecutivo / Clave → N° factura
 *  - Total Comprobante / Total Factura → monto
 *  - Fecha de Emisión → fecha
 */
export async function parsePDF(file: File): Promise<ParsedInvoice | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Worker via CDN — evita conflictos con bundler de Next.js
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    let fullText = "";
    const pages = Math.min(pdf.numPages, 6);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      fullText += pageText + " ";
    }

    if (!fullText.trim()) {
      // El PDF es imagen escaneada — no se puede leer sin OCR
      return { invoiceNumber: "", supplier: "", amount: 0, date: "", description: "PDF de imagen — ingresá los datos manualmente", detectedType: "factura" };
    }

    return parseInvoiceText(fullText);
  } catch (err) {
    console.error("PDF parse error:", err);
    return null;
  }
}

function parseInvoiceText(text: string): ParsedInvoice | null {
  const clean = text.replace(/\s+/g, " ").trim();

  // Detectar idioma del documento
  const isEnglish = /Invoice\s*#|Invoice\s*Number|Amount\s*Due|Bill\s*To|Receipt/i.test(clean);

  // ── Número de factura ────────────────────────────────────────
  const invoicePatterns = isEnglish
    ? [
        /Invoice\s*#\s*:?\s*([A-Z0-9\-\_]{4,30})/i,
        /Invoice\s*Number\s*:?\s*([A-Z0-9\-\_]{4,30})/i,
        /Receipt\s*#\s*:?\s*([A-Z0-9\-\_]{4,30})/i,
        /Order\s*#\s*:?\s*([A-Z0-9\-\_]{4,30})/i,
        /\b([A-Z]{2,}[0-9A-Z\-]{4,})\b/,
      ]
    : [
        /[Nn][úu]mero\s+[Cc]onsecutivo[:\s]+([0-9]{20})/,
        /[Cc]onsecutivo[:\s]+([0-9]{20})/,
        /\b([0-9]{20})\b/,
        /[Cc]lave[:\s]+([0-9]{50})/,
        /\b([A-Z]{2,}[0-9A-Z\-]{4,})\b/,
      ];

  let invoiceNumber = "";
  for (const pattern of invoicePatterns) {
    const m = clean.match(pattern);
    if (m) { invoiceNumber = m[1]; break; }
  }

  // ── Proveedor / Emisor ───────────────────────────────────────
  const supplierPatterns = isEnglish
    ? [
        /From[:\s]+([A-Z][^\n,;]{3,60})/i,
        /^(Anthropic|OpenAI|Amazon|Google|Microsoft|AWS|GitHub|Notion|Slack|Zoom|Adobe|Figma|Canva|Cloudflare|Vercel|Stripe|PayPal)/im,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+Invoice/i,
        /Invoice\s+from\s+([^\n,;]{3,50})/i,
      ]
    : [
        /[Ee]misor[:\s]+([A-ZÁÉÍÓÚÑ][^\n,;]{3,60})/,
        /[Nn]ombre\s+del?\s+[Ee]misor[:\s]+([^\n,;]{3,60})/,
        /[Rr]az[oó]n\s+[Ss]ocial[:\s]+([^\n,;]{3,60})/,
        /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,]{5,50})\s*(?:Cédula|RUC|N°)/m,
      ];

  let supplier = "";
  for (const pattern of supplierPatterns) {
    const m = clean.match(pattern);
    if (m) { supplier = m[1].trim(); break; }
  }

  // ── Monto ────────────────────────────────────────────────────
  const amountPatterns = isEnglish
    ? [
        /Amount\s+Due[:\s]+\$?([\d,\.]+)/i,
        /Total\s+Due[:\s]+\$?([\d,\.]+)/i,
        /Total\s+Amount[:\s]+\$?([\d,\.]+)/i,
        /Total[:\s]+\$?([\d,\.]+)/i,
        /\$\s*([\d,\.]+)/,
      ]
    : [
        /[Tt]otal\s+[Cc]omprobante[:\s₡]+([\d,\.]+)/,
        /[Tt]otal\s+[Ff]actura[:\s₡]+([\d,\.]+)/,
        /[Mm]onto\s+[Tt]otal[:\s₡]+([\d,\.]+)/,
        /[Tt]otal[:\s₡]+([\d]{1,3}(?:[,\.]\d{3})+(?:[,\.]\d{2})?)/,
      ];

  let amount = 0;
  for (const pattern of amountPatterns) {
    const m = clean.match(pattern);
    if (m) {
      const raw = m[1].replace(/,/g, "");
      amount = parseFloat(raw) || 0;
      if (amount > 0) break;
    }
  }

  // ── Fecha ────────────────────────────────────────────────────
  const MONTHS: Record<string, string> = {
    january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
    july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
  };
  const datePatterns = isEnglish
    ? [
        /(?:Invoice\s+)?Date[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
        /Date[:\s]+(\d{4}-\d{2}-\d{2})/i,
        /Date[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
        /(\d{4}-\d{2}-\d{2})/,
      ]
    : [
        /[Ff]echa\s+(?:de\s+)?[Ee]misi[oó]n[:\s]+(\d{4}-\d{2}-\d{2})/,
        /[Ff]echa[:\s]+(\d{2}\/\d{2}\/\d{4})/,
        /(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/,
      ];

  let date = "";
  for (const pattern of datePatterns) {
    const m = clean.match(pattern);
    if (m) {
      const raw = m[1];
      // "March 15, 2026" → "2026-03-15"
      const wordy = raw.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (wordy) {
        const mo = MONTHS[wordy[1].toLowerCase()] ?? "01";
        date = `${wordy[3]}-${mo}-${wordy[2].padStart(2,"0")}`;
      } else if (raw.includes("/")) {
        const [d, mo, y] = raw.split("/");
        date = `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;
      } else {
        date = raw.substring(0, 10);
      }
      break;
    }
  }

  // ── Descripción ──────────────────────────────────────────────
  const descPatterns = isEnglish
    ? [
        /Description[:\s]+([^\n]{5,80})/i,
        /Plan[:\s]+([^\n]{5,60})/i,
        /Service[:\s]+([^\n]{5,60})/i,
      ]
    : [
        /[Dd]etalle[:\s]+([^\n]{5,80})/,
        /[Dd]escripci[oó]n[:\s]+([^\n]{5,80})/,
      ];

  let description = "";
  for (const pattern of descPatterns) {
    const m = clean.match(pattern);
    if (m) { description = m[1].trim(); break; }
  }

  // ── Tipo ─────────────────────────────────────────────────────
  const isTiquete = /[Tt]iquete/i.test(clean);
  const isReceipt = /receipt/i.test(clean) && !isEnglish;
  const detectedType: ParsedInvoice["detectedType"] =
    isTiquete || isReceipt ? "reintegro" : "factura";

  if (!invoiceNumber && amount === 0) return null;

  return { invoiceNumber, supplier, amount, date, description, detectedType };
}
