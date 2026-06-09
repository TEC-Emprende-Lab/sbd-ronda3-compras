"use client";

import { useState } from "react";
import { formatCRC } from "@/lib/types";
import type { ProjectSummary } from "@/app/reporte/general/page";

const CAT_LABEL: Record<string, string> = {
  prototipado: "Prototipado",
  puesta_en_marcha: "Puesta en Marcha",
};

export default function ReporteGeneralClient({ summaries }: { summaries: ProjectSummary[] }) {
  const [generating, setGenerating] = useState(false);

  const cats = ["prototipado", "puesta_en_marcha"];
  const totals = summaries.reduce(
    (a, s) => ({
      budget: a.budget + s.budget, aprobado: a.aprobado + s.aprobado,
      enProceso: a.enProceso + s.enProceso, disponible: a.disponible + s.disponible,
      tramites: a.tramites + s.tramites,
    }),
    { budget: 0, aprobado: 0, enProceso: 0, disponible: 0, tramites: 0 }
  );
  const pctTotal = totals.budget > 0 ? Math.round((totals.aprobado / totals.budget) * 100) : 0;

  async function generatePDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });

      // Header
      doc.setFillColor(26, 22, 18); doc.rect(0, 0, W, 26, "F");
      doc.setFillColor(232, 82, 26); doc.roundedRect(10, 6, 14, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text("T", 17, 16, { align: "center" });
      doc.setFontSize(12); doc.text("TEC EMPRENDE Lab", 28, 12);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(179, 168, 146);
      doc.text("Control de Compras · SBD Ronda 3", 28, 19);
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text("Reporte General de Proyectos", W / 2, 12, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(179, 168, 146);
      doc.text(`Generado: ${today}`, W / 2, 19, { align: "center" });

      const body: (string | number)[][] = [];
      cats.forEach((cat) => {
        const rows = summaries.filter((s) => s.category === cat);
        if (rows.length === 0) return;
        body.push([{ content: CAT_LABEL[cat], colSpan: 7, styles: { fillColor: [242, 232, 208], textColor: [26, 22, 18], fontStyle: "bold" } } as unknown as string]);
        rows.forEach((s) => body.push([
          `#${s.id}  ${s.name}`,
          formatCRC(s.budget),
          formatCRC(s.aprobado),
          formatCRC(s.enProceso),
          formatCRC(s.disponible),
          `${s.pctEjecutado}%`,
          s.tramites,
        ]));
      });

      autoTable(doc, {
        startY: 32,
        margin: { left: 10, right: 10 },
        head: [["Proyecto", "Presupuesto", "Aprobado", "En proceso", "Disponible", "% Ejec.", "Trám."]],
        body,
        foot: [[
          "TOTAL",
          formatCRC(totals.budget), formatCRC(totals.aprobado),
          formatCRC(totals.enProceso), formatCRC(totals.disponible),
          `${pctTotal}%`, totals.tramites,
        ]],
        headStyles: { fillColor: [26, 22, 18], textColor: [250, 245, 236], fontSize: 8 },
        footStyles: { fillColor: [26, 22, 18], textColor: [250, 245, 236], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [26, 22, 18] },
        alternateRowStyles: { fillColor: [250, 245, 236] },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" },
          4: { halign: "right" }, 5: { halign: "center", cellWidth: 18 }, 6: { halign: "center", cellWidth: 16 },
        },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5); doc.setTextColor(140, 130, 110);
        doc.text("TEC Emprende Lab · Control de Compras SBD Ronda 3", 10, doc.internal.pageSize.getHeight() - 5);
        doc.text(`Página ${i} de ${pageCount}`, W - 10, doc.internal.pageSize.getHeight() - 5, { align: "right" });
      }

      doc.save(`Reporte_General_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      {/* Controles */}
      <div className="card card-padded mb-6" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div><p className="caps">Presupuesto total</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--black)" }}>{formatCRC(totals.budget)}</p></div>
          <div><p className="caps">Aprobado</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{formatCRC(totals.aprobado)}</p></div>
          <div><p className="caps">En proceso</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--orange)" }}>{formatCRC(totals.enProceso)}</p></div>
          <div><p className="caps">Disponible</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--black)" }}>{formatCRC(totals.disponible)}</p></div>
        </div>
        <button onClick={generatePDF} disabled={generating} className="btn btn-orange" style={{ flexShrink: 0 }}>
          {generating ? "Generando..." : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      </div>

      {/* Tabla por categoría */}
      {cats.map((cat) => {
        const rows = summaries.filter((s) => s.category === cat);
        if (rows.length === 0) return null;
        return (
          <div key={cat} className="card mb-4">
            <div style={{ padding: "12px 20px", background: "var(--cream-2)", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>{CAT_LABEL[cat]} · {rows.length} proyectos</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="ttable">
                <thead>
                  <tr>
                    {["Proyecto", "Presupuesto", "Aprobado", "En proceso", "Disponible", "% Ejec.", "Trám."].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12, fontWeight: 600, maxWidth: 240 }}>
                        <span className="caps" style={{ color: "var(--orange)", marginRight: 6 }}>#{s.id}</span>{s.name}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatCRC(s.budget)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", color: "var(--green)" }}>{formatCRC(s.aprobado)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", color: "var(--orange)" }}>{formatCRC(s.enProceso)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{formatCRC(s.disponible)}</td>
                      <td style={{ textAlign: "center" }}>{s.pctEjecutado}%</td>
                      <td style={{ textAlign: "center", color: "var(--gray)" }}>{s.tramites}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
