#!/usr/bin/env node
/**
 * Compara el nombre de proveedor que hay en la plataforma contra el nombre
 * que trae el nombre de archivo real en las carpetas de Ejecución de
 * Catalitec (convención: "Proveedor - NumeroFactura.pdf").
 *
 * Solo se puede correr LOCAL, en esta computadora — los documentos viven
 * en una carpeta de OneDrive/red, no en ningún servidor. No es parte de
 * la app desplegada en Vercel.
 *
 * Uso: node scripts/verificar-proveedores.js
 * (opcional) node scripts/verificar-proveedores.js "C:\ruta\a\3 Ejecución"
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://qhmynvpgmrupqzojcvua.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobXludnBnbXJ1cHF6b2pjdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTI1MTQsImV4cCI6MjA5NDg2ODUxNH0.ZovfZbRE4pi8US-On6I0jOir9bWFf1OG9hVamyTd0lI";

const DEFAULT_BASE =
  "C:\\Users\\miarias\\TEC\\Administración Catalitec - General\\Ronda 3 25-26\\3 Ejecución";

const baseDir = process.argv[2] || DEFAULT_BASE;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function looksLikeInvoiceNumber(token) {
  const digits = (token.match(/[0-9]/g) || []).length;
  return token.length >= 6 && digits / token.length > 0.6;
}

/** Extrae {proveedor, numero} de un nombre de archivo tipo
 *  "Proveedor - Numero.ext" o "Numero - Proveedor.ext". null si no calza. */
function parseFilename(filename) {
  const base = filename.replace(/\.(pdf|xml|jpg|jpeg|png)$/i, "");
  const parts = base.split(/\s*-\s*/);
  if (parts.length < 2) return null;

  const last = parts[parts.length - 1].trim();
  const rest = parts.slice(0, -1).join(" - ").trim();

  if (looksLikeInvoiceNumber(last) && !looksLikeInvoiceNumber(rest.replace(/\s/g, ""))) {
    return { proveedor: rest, numero: last };
  }
  const first = parts[0].trim();
  const restFromSecond = parts.slice(1).join(" - ").trim();
  if (looksLikeInvoiceNumber(first) && !looksLikeInvoiceNumber(restFromSecond.replace(/\s/g, ""))) {
    return { proveedor: restFromSecond, numero: first };
  }
  return null;
}

function normalize(s) {
  return (s || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** ¿Se parecen razonablemente? (uno contiene al otro, con o sin espacios,
 *  o comparten la primera palabra significativa) — evita falsos positivos
 *  por "S.A." / "SOCIEDAD ANONIMA" / abreviaturas ("ExtremeTech" vs
 *  "EXTREME TECHNOLOGY CORP E T C SOCIEDAD ANONIMA" sí son la misma). */
function looksSimilar(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return true; // sin dato suficiente, no lo marca
  if (na.includes(nb) || nb.includes(na)) return true;
  const ca = na.replace(/\s+/g, "");
  const cb = nb.replace(/\s+/g, "");
  if (ca.length > 3 && cb.length > 3 && (ca.includes(cb) || cb.includes(ca))) return true;
  const wa = na.split(" ")[0];
  const wb = nb.split(" ")[0];
  return wa.length > 2 && wa === wb;
}

/** Nombre de proyecto de la carpeta (ej. "Academia Ciberseguridad Zenthik")
 *  a partir de la ruta. El código de 8 dígitos (09004201...) es el código
 *  institucional de Catalitec — NO tiene relación con el id numérico que
 *  Supabase le asignó al proyecto (42, 44, 45...), así que el nombre es la
 *  única forma confiable de emparejar carpeta ↔ proyecto en la plataforma. */
function projectFolderNameFromPath(filePath) {
  const m = filePath.match(/[\\/]\d{8}\s*-\s*([^\\/]+?)[\\/]/);
  return m ? m[1].trim() : null;
}

async function fetchAllTramites() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tramites?select=id,project_id,invoice_number,supplier,project:projects(id,name)&deleted_at=is.null&invoice_number=not.is.null`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  if (!res.ok) throw new Error(`Error consultando Supabase: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchProjects() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,name`, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`Error consultando proyectos: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`Escaneando: ${baseDir}\n`);
  const files = walk(baseDir);
  const candidates = [];
  for (const f of files) {
    const parsed = parseFilename(path.basename(f));
    if (parsed && parsed.proveedor) {
      candidates.push({ ...parsed, path: f, folderName: projectFolderNameFromPath(f) });
    }
  }
  console.log(`Archivos con patrón proveedor-número reconocido: ${candidates.length} de ${files.length} archivos totales\n`);

  const [tramites, projects] = await Promise.all([fetchAllTramites(), fetchProjects()]);

  // Solo compara dentro del MISMO proyecto — estos números de documento
  // bajos (00000001, 00000002...) se repiten entre proyectos distintos
  // por coincidencia, así que comparar sin filtrar por proyecto genera
  // montones de falsos positivos cruzados.
  const tramitesByProjectAndInvoice = new Map();
  for (const t of tramites) {
    const key = `${t.project_id}__${t.invoice_number}`;
    if (!tramitesByProjectAndInvoice.has(key)) tramitesByProjectAndInvoice.set(key, []);
    tramitesByProjectAndInvoice.get(key).push(t);
  }

  const mismatches = [];
  const sinProyecto = [];
  for (const c of candidates) {
    if (!c.folderName) continue;
    const project = projects.find((p) => looksSimilar(p.name, c.folderName));
    if (!project) {
      sinProyecto.push(c);
      continue;
    }
    const rows = tramitesByProjectAndInvoice.get(`${project.id}__${c.numero}`);
    if (!rows) continue; // no está en la plataforma; no es este script el que lo revisa
    for (const t of rows) {
      if (!looksSimilar(c.proveedor, t.supplier)) {
        mismatches.push({
          numero: c.numero,
          archivoProveedor: c.proveedor,
          plataformaProveedor: t.supplier,
          proyecto: t.project?.name || `#${t.project_id}`,
          archivo: c.path,
        });
      }
    }
  }

  if (sinProyecto.length > 0) {
    console.log(
      `(${sinProyecto.length} archivos no se pudieron ubicar en un proyecto de la plataforma por su carpeta; se omitieron)\n`
    );
  }

  if (mismatches.length === 0) {
    console.log("✅ No se encontraron proveedores que no calcen con el nombre de archivo real.");
    return;
  }

  console.log(`⚠ ${mismatches.length} posibles proveedores mal digitados:\n`);
  for (const m of mismatches) {
    console.log(`Factura ${m.numero} — proyecto ${m.proyecto}`);
    console.log(`  Plataforma dice: "${m.plataformaProveedor}"`);
    console.log(`  Archivo real dice: "${m.archivoProveedor}"`);
    console.log(`  ${m.archivo}`);
    console.log("");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
