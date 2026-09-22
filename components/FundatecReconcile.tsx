"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { parseFundatecReport, sumByDocumento, type FundatecReport } from "@/lib/fundatec-parser";
import type { Project } from "@/lib/types";

type Row = {
  id: string;
  invoice_number: string;
  supplier: string | null;
  amount: number;
  approval_date: string | null;
};

type MatchResult = {
  tramite: Row;
  fundatecAmount: number | null;
  diff: number | null;
  status: "ok" | "diferencia" | "no_encontrado";
  foundInOtherProject: { id: number; name: string } | null;
};

export default function FundatecReconcile({ projects }: { projects: Project[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [report, setReport] = useState<FundatecReport | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processHtml = useCallback(
    async (html: string) => {
      setError(null);
      setResults([]);
      const parsed = parseFundatecReport(html);
      if (parsed.rows.length === 0) {
        setError("No se encontraron filas de movimientos en el archivo. ¿Es un reporte rpSituacion válido?");
        return;
      }
      setReport(parsed);

      const match = projects.find(
        (p) => String(p.id).padStart(8, "0") === parsed.projectCode || p.name === parsed.projectName
      );
      setSelectedProjectId(match ? match.id : null);
      if (match) await reconcile(parsed, match.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects]
  );

  async function handleFile(file: File) {
    const text = await file.text().catch(() => null);
    // El archivo suele venir en ISO-8859-1; si file.text() trae caracteres
    // rotos (ñ/tildes), reintenta decodificando explícito.
    let html = text ?? "";
    if (html.includes("�") || /Ã|Â/.test(html)) {
      const buf = await file.arrayBuffer();
      html = new TextDecoder("iso-8859-1").decode(buf);
    }
    await processHtml(html);
  }

  // Puente con la extensión de Chrome: al descargar el rpSituacion.xls del
  // SOIN, la extensión abre esta página y despacha este evento con el
  // contenido ya leído, sin que haya que volver a seleccionar el archivo.
  useEffect(() => {
    function onAutoload(e: Event) {
      const detail = (e as CustomEvent<{ html: string }>).detail;
      if (detail?.html) processHtml(detail.html);
    }
    window.addEventListener("fundatec-tracker:autoload", onAutoload);
    // Avisa a la extensión (si está instalada y ya cargó su content script)
    // que la página está lista, por si el archivo llegó antes de esto.
    window.dispatchEvent(new CustomEvent("fundatec-tracker:ready"));
    return () => window.removeEventListener("fundatec-tracker:autoload", onAutoload);
  }, [processHtml]);

  async function reconcile(parsed: FundatecReport, projectId: number) {
    setLoading(true);
    setError(null);
    try {
      const fundByInvoice = sumByDocumento(parsed.rows);

      const { data: tramites, error: err } = await supabase
        .from("tramites")
        .select("id, invoice_number, supplier, amount, approval_date")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .not("invoice_number", "is", null);
      if (err) throw err;

      const out: MatchResult[] = [];
      for (const t of (tramites ?? []) as Row[]) {
        const fAmt = fundByInvoice.get(t.invoice_number);
        if (fAmt === undefined) {
          // No está en este proyecto del reporte: buscar si existe en OTRO proyecto
          const { data: elsewhere } = await supabase
            .from("tramites")
            .select("project_id, project:projects(id, name)")
            .eq("invoice_number", t.invoice_number)
            .neq("project_id", projectId)
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();
          const otherProject = (elsewhere as unknown as { project: { id: number; name: string } } | null)
            ?.project;
          out.push({
            tramite: t,
            fundatecAmount: null,
            diff: null,
            status: "no_encontrado",
            foundInOtherProject: otherProject ?? null,
          });
        } else {
          const diff = +(fAmt - Number(t.amount)).toFixed(2);
          out.push({
            tramite: t,
            fundatecAmount: fAmt,
            diff,
            status: Math.abs(diff) < 0.5 ? "ok" : "diferencia",
            foundInOtherProject: null,
          });
        }
      }
      out.sort((a, b) => (a.status === "ok" ? 1 : 0) - (b.status === "ok" ? 1 : 0));
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conciliar.");
    } finally {
      setLoading(false);
    }
  }

  async function moveToProject(tramiteId: string, newProjectId: number) {
    setMoving(tramiteId);
    const { error: err } = await supabase
      .from("tramites")
      .update({ project_id: newProjectId })
      .eq("id", tramiteId);
    setMoving(null);
    if (err) {
      setError(`Error al mover: ${err.message}`);
      return;
    }
    setResults((prev) => prev.filter((r) => r.tramite.id !== tramiteId));
  }

  const fmt = (n: number) =>
    n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="card card-padded" style={{ marginBottom: 20 }}>
        <label
          htmlFor="fundatec-file"
          className="btn btn-orange btn-sm"
          style={{ display: "inline-block", cursor: "pointer" }}
        >
          Subir reporte rpSituacion (.xls)
        </label>
        <input
          id="fundatec-file"
          type="file"
          accept=".xls,.html,.htm"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {report && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--gray)" }}>
            Proyecto detectado en el archivo: <strong>{report.projectCode ?? "?"} — {report.projectName ?? "?"}</strong>
            {report.generatedAt && <> · generado {report.generatedAt}</>}
            <> · {report.rows.length} filas leídas</>
          </div>
        )}
        {report && (
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 12, color: "var(--gray)", marginRight: 8 }}>
              Conciliar contra proyecto:
            </label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProjectId(id);
                if (report) reconcile(report, id);
              }}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}
            >
              <option value="" disabled>
                Selecciona un proyecto
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && (
          <p style={{ color: "#991B1B", fontSize: 13, marginTop: 10 }}>{error}</p>
        )}
      </div>

      {loading && <p style={{ color: "var(--gray)" }}>Conciliando…</p>}

      {!loading && results.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--cream-2)" }}>
                <th style={th}>Estado</th>
                <th style={th}>Factura</th>
                <th style={th}>Proveedor</th>
                <th style={{ ...th, textAlign: "right" }}>Plataforma</th>
                <th style={{ ...th, textAlign: "right" }}>FUNDATEC</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.tramite.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>
                    {r.status === "ok" && <span className="badge badge-green">Calza</span>}
                    {r.status === "diferencia" && <span className="badge badge-amber">Diferencia</span>}
                    {r.status === "no_encontrado" && (
                      <span className="badge badge-red">No está</span>
                    )}
                  </td>
                  <td style={td}>{r.tramite.invoice_number}</td>
                  <td style={td}>{r.tramite.supplier}</td>
                  <td style={{ ...td, textAlign: "right" }}>₡{fmt(Number(r.tramite.amount))}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {r.fundatecAmount !== null ? `₡${fmt(r.fundatecAmount)}` : "—"}
                  </td>
                  <td style={td}>
                    {r.foundInOtherProject && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={moving === r.tramite.id}
                        onClick={() => moveToProject(r.tramite.id, r.foundInOtherProject!.id)}
                      >
                        {moving === r.tramite.id
                          ? "Moviendo…"
                          : `Mover a ${r.foundInOtherProject.name}`}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--gray)" };
const td: React.CSSProperties = { padding: "8px 12px" };
