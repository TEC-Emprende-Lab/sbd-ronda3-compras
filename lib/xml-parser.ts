export interface ParsedInvoice {
  invoiceNumber: string;
  supplier: string;
  amount: number;
  date: string;
  description: string;
  detectedType: "factura" | "orden_compra" | "reintegro";
}

export function parseCostaRicaXML(xmlText: string): ParsedInvoice | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const err = doc.querySelector("parsererror");
    if (err) return null;

    const get = (tag: string): string => {
      const el =
        doc.getElementsByTagNameNS("*", tag)[0] ||
        doc.querySelector(tag);
      return el?.textContent?.trim() ?? "";
    };

    // Número de factura: preferir NumeroConsecutivo, fallback Clave
    const consecutivo = get("NumeroConsecutivo");
    const clave = get("Clave");
    const invoiceNumber = consecutivo || clave || "";

    // Proveedor (Emisor)
    const supplier = get("Nombre") || get("NombreEmisor") || "";

    // Monto total
    const totalStr =
      get("TotalComprobante") ||
      get("TotalFactura") ||
      get("TotalVenta") ||
      "0";
    const amount = parseFloat(totalStr.replace(/,/g, "")) || 0;

    // Fecha
    const rawDate = get("FechaEmision") || get("Fecha") || "";
    const date = rawDate ? rawDate.substring(0, 10) : "";

    // Descripción: primero detalle de línea, fallback vacío
    const detalle =
      get("Detalle") ||
      get("Descripcion") ||
      get("UnidadMedida") ||
      "";
    const description = detalle.substring(0, 200);

    // Detectar tipo por root element
    const rootName = doc.documentElement.localName.toLowerCase();
    let detectedType: ParsedInvoice["detectedType"] = "factura";
    if (rootName.includes("tiquete")) detectedType = "reintegro";
    else if (rootName.includes("nota")) detectedType = "factura";

    if (!invoiceNumber && !amount) return null;

    return { invoiceNumber, supplier, amount, date, description, detectedType };
  } catch {
    return null;
  }
}
