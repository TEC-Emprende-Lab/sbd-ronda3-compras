// Parser del reporte "Situación Presupuestaria" (rpSituacion) que exporta
// el sistema de FUNDATEC. El archivo viene con extensión .xls pero en
// realidad es HTML — cada corrida del sistema puede variar levemente el
// formato de las descripciones (ej. "Factura#" vs "FACT#"), así que el
// parseo es genérico por posición de columna, no por texto de la descripción.

export type FundatecTipo =
  | "factura"
  | "comision_bancaria"
  | "traslado"
  | "ingreso"
  | "otro";

export interface FundatecRow {
  fecha: string; // ISO yyyy-mm-dd
  documentoPago: string;
  numeroFactura: string | null;
  ocNumero: string | null;
  proveedor: string;
  descripcion: string;
  tipo: FundatecTipo;
  monto: number; // negativo = egreso, tal cual el reporte
}

export interface FundatecReport {
  projectCode: string | null;
  projectName: string | null;
  generatedAt: string | null;
  rows: FundatecRow[];
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function ddmmyyyyToISO(value: string): string {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo}-${d}`;
}

function classify(documentoPago: string, descripcion: string): FundatecTipo {
  const d = descripcion.toUpperCase();
  if (d.includes("COMISION") || d.includes("COMISIÓN")) return "comision_bancaria";
  if (d.includes("TRASLADO")) return "traslado";
  if (/^\d{2,4}$/.test(documentoPago) && !d.includes("FACTURA") && !d.includes("FACT#"))
    return "ingreso";
  if (/factura|fact#/i.test(descripcion) || /^\d{18,20}$/.test(documentoPago)) return "factura";
  return "otro";
}

export function parseFundatecReport(html: string): FundatecReport {
  const projectMatch = html.match(
    /Proyecto:\s*([0-9]+)\s*-\s*([^<]+?)\s*(?:<|-\s*\(Responsable)/i
  );
  const generatedMatch = html.match(/Reporte generado el\s*([0-9-]+\s+[0-9:]+)/i);

  const rows: FundatecRow[] = [];
  const trBlocks = html.split(/<tr[^>]*>/i).slice(1);

  for (const block of trBlocks) {
    const trContent = block.split(/<\/tr>/i)[0];
    const cells = trContent
      .split(/<td[^>]*>/i)
      .slice(1)
      .map((c) => stripTags(c.split(/<\/td>/i)[0]));

    // Filas de datos reales: 12 columnas, con fecha dd/mm/yyyy en la posición 5
    if (cells.length !== 12 || !/^\d{2}\/\d{2}\/\d{4}$/.test(cells[5])) continue;

    const documentoPago = (cells[1].split("(")[0] || "").trim();
    const proveedor = cells[3].trim();
    const descripcionRaw = cells[4].trim();
    const fecha = ddmmyyyyToISO(cells[5]);
    const monto = parseFloat(cells[7].replace(/,/g, "")) || 0;

    const facturaMatch = descripcionRaw.match(/(?:Factura#|FACT#)\s*([0-9]+)/i);
    const ocMatch = descripcionRaw.match(/OC\s*#\s*([0-9]+)/i);

    // Limpia número de factura/OC repetidos de la descripción
    let descripcion = descripcionRaw
      .replace(/(?:Factura#|FACT#)\s*[0-9]+,?\s*/gi, "")
      .replace(/OC\s*#\s*[0-9]+,?\s*/gi, "")
      .trim();
    // El reporte suele repetir el número de factura al final de la descripción
    if (facturaMatch) {
      descripcion = descripcion.replace(new RegExp(`\\s*${facturaMatch[1]}\\s*$`), "").trim();
    }

    rows.push({
      fecha,
      documentoPago,
      numeroFactura: facturaMatch ? facturaMatch[1] : documentoPago || null,
      ocNumero: ocMatch ? ocMatch[1] : null,
      proveedor,
      descripcion,
      tipo: classify(documentoPago, descripcionRaw),
      monto,
    });
  }

  return {
    projectCode: projectMatch ? projectMatch[1] : null,
    projectName: projectMatch ? projectMatch[2].trim() : null,
    generatedAt: generatedMatch ? generatedMatch[1] : null,
    rows,
  };
}

/** Suma el consumido por documento de pago (factura), en valor absoluto. */
export function sumByDocumento(rows: FundatecRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.tipo !== "factura" && r.tipo !== "otro") continue;
    const key = r.numeroFactura || r.documentoPago;
    map.set(key, (map.get(key) ?? 0) + Math.abs(r.monto));
  }
  return map;
}
