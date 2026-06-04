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
    // Carga dinámica de pdfjs-dist para evitar problemas de SSR
    const pdfjsLib = await import("pdfjs-dist");

    // Usar worker fake para evitar problemas con Webpack en Next.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    // Extraer todo el texto del PDF
    let fullText = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    return parseInvoiceText(fullText);
  } catch (err) {
    console.error("PDF parse error:", err);
    return null;
  }
}

function parseInvoiceText(text: string): ParsedInvoice | null {
  const clean = text.replace(/\s+/g, " ").trim();

  // ── Número de factura ────────────────────────────────────────
  // Primero buscar Número Consecutivo (20 dígitos), luego Clave (50 dígitos)
  const invoicePatterns = [
    /[Nn][úu]mero\s+[Cc]onsecutivo[:\s]+([0-9]{20})/,
    /[Cc]onsecutivo[:\s]+([0-9]{20})/,
    /\b([0-9]{20})\b/,
    /[Cc]lave[:\s]+([0-9]{50})/,
    /\b([A-Z]{2,}[0-9A-Z\-]{4,})\b/,  // ej. VJBKOVPH-0002
  ];
  let invoiceNumber = "";
  for (const pattern of invoicePatterns) {
    const m = clean.match(pattern);
    if (m) { invoiceNumber = m[1]; break; }
  }

  // ── Proveedor / Emisor ───────────────────────────────────────
  const supplierPatterns = [
    /[Ee]misor[:\s]+([A-ZÁÉÍÓÚÑ][^\n,;]{3,60})/,
    /[Nn]ombre\s+del?\s+[Ee]misor[:\s]+([^\n,;]{3,60})/,
    /[Rr]az[oó]n\s+[Ss]ocial[:\s]+([^\n,;]{3,60})/,
    /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,S\.A\.LTDA]{5,50})\s*(?:Cédula|RUC|N°)/m,
  ];
  let supplier = "";
  for (const pattern of supplierPatterns) {
    const m = clean.match(pattern);
    if (m) { supplier = m[1].trim(); break; }
  }

  // ── Monto ────────────────────────────────────────────────────
  const amountPatterns = [
    /[Tt]otal\s+[Cc]omprobante[:\s₡]+([\d,\.]+)/,
    /[Tt]otal\s+[Ff]actura[:\s₡]+([\d,\.]+)/,
    /[Mm]onto\s+[Tt]otal[:\s₡]+([\d,\.]+)/,
    /[Tt]otal[:\s₡]+([\d]{1,3}(?:[,\.]\d{3})+(?:[,\.]\d{2})?)/,
  ];
  let amount = 0;
  for (const pattern of amountPatterns) {
    const m = clean.match(pattern);
    if (m) {
      // Normalizar formato costarricense: 1.234.567,89 o 1,234,567.89
      const raw = m[1].replace(/\./g, "").replace(",", ".");
      amount = parseFloat(raw) || 0;
      if (amount > 0) break;
    }
  }

  // ── Fecha ────────────────────────────────────────────────────
  const datePatterns = [
    /[Ff]echa\s+(?:de\s+)?[Ee]misi[oó]n[:\s]+(\d{4}-\d{2}-\d{2})/,
    /[Ff]echa[:\s]+(\d{2}\/\d{2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/,
  ];
  let date = "";
  for (const pattern of datePatterns) {
    const m = clean.match(pattern);
    if (m) {
      // Normalizar a YYYY-MM-DD
      const raw = m[1];
      if (raw.includes("/")) {
        const [d, mo, y] = raw.split("/");
        date = `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;
      } else {
        date = raw.substring(0, 10);
      }
      break;
    }
  }

  // ── Descripción (primera línea de detalle) ───────────────────
  const descPatterns = [
    /[Dd]etalle[:\s]+([^\n]{5,80})/,
    /[Dd]escripci[oó]n[:\s]+([^\n]{5,80})/,
  ];
  let description = "";
  for (const pattern of descPatterns) {
    const m = clean.match(pattern);
    if (m) { description = m[1].trim(); break; }
  }

  // ── Tipo: tiquete vs factura ─────────────────────────────────
  const isTiquete = /[Tt]iquete/i.test(clean);
  const detectedType: ParsedInvoice["detectedType"] = isTiquete ? "reintegro" : "factura";

  if (!invoiceNumber && amount === 0) return null;

  return { invoiceNumber, supplier, amount, date, description, detectedType };
}
