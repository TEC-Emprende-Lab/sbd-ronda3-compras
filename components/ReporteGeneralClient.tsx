"use client";

import { useState } from "react";
import { formatCRC, formatCRCpdf, type TramiteType } from "@/lib/types";
import { loadLogoDataUrl, LOGO_RATIO } from "@/lib/pdf-utils";
import type { ProjectSummary } from "@/app/reporte/general/page";

const CAT_LABEL: Record<string, string> = {
  prototipado: "Prototipado",
  puesta_en_marcha: "Puesta en Marcha",
};

const TYPE_META: { key: TramiteType; label: string; color: string }[] = [
  { key: "factura",           label: "Compras OC",  color: "#8098C8" },
  { key: "reintegro",         label: "Reintegros",  color: "#6D28D9" },
  { key: "uso_tc",            label: "Uso de TC",   color: "#E8A33A" },
  { key: "comision_bancaria", label: "Comisiones",  color: "#8A8070" },
];

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

  // Totales por tipo (todos los proyectos)
  const typeTotals = TYPE_META.map((tm) => {
    const amount = summaries.reduce((s, p) => s + p.byType[tm.key].amount, 0);
    const count = summaries.reduce((s, p) => s + p.byType[tm.key].count, 0);
    return { ...tm, amount, count };
  });
  const typeSum = typeTotals.reduce((s, t) => s + t.amount, 0) || 1;

  async function generatePDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const logo = await loadLogoDataUrl();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });

      // Header
      doc.setFillColor(26, 22, 18); doc.rect(0, 0, W, 26, "F");
      if (logo) {
        const h = 12; doc.addImage(logo, "PNG", 10, 7, h * LOGO_RATIO, h);
      } else {
        doc.setFillColor(232, 82, 26); doc.roundedRect(10, 6, 14, 14, 2, 2, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("T", 17, 16, { align: "center" });
        doc.setFontSize(12); doc.text("TEC EMPRENDE Lab", 28, 14);
      }
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text("Reporte General de Proyectos", W / 2, 12, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(179, 168, 146);
      doc.text(`Generado: ${today}`, W / 2, 19, { align: "center" });

      // Resumen de totales
      let y = 33;
      doc.setTextColor(26, 22, 18); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(
        `Presupuesto: ${formatCRCpdf(totals.budget)}    Aprobado: ${formatCRCpdf(totals.aprobado)} (${pctTotal}%)    En proceso: ${formatCRCpdf(totals.enProceso)}    Disponible: ${formatCRCpdf(totals.disponible)}`,
        10, y
      );
      y += 6;

      const body: unknown[][] = [];
      cats.forEach((cat) => {
        const rows = summaries.filter((s) => s.category === cat);
        if (rows.length === 0) return;
        body.push([{ content: CAT_LABEL[cat], colSpan: 7, styles: { fillColor: [242, 232, 208], textColor: [26, 22, 18], fontStyle: "bold", halign: "left" } }]);
        rows.forEach((s) => {
          const desg = TYPE_META.map((tm) => s.byType[tm.key].count > 0 ? `${s.byType[tm.key].count} ${tm.label.split(" ")[0].toLowerCase()}` : null).filter(Boolean).join(", ");
          body.push([
            `#${s.id}  ${s.name}`,
            formatCRCpdf(s.budget),
            formatCRCpdf(s.aprobado),
            formatCRCpdf(s.enProceso),
            formatCRCpdf(s.disponible),
            `${s.pctEjecutado}%`,   // texto arriba; barra dibujada abajo
            desg || "—",
          ]);
        });
      });

      autoTable(doc, {
        startY: y,
        margin: { left: 10, right: 10 },
        head: [["Proyecto", "Presupuesto", "Aprobado", "En proceso", "Disponible", "% Ejecutado", "Trámites por tipo"]],
        body: body as never,
        foot: [[
          "TOTAL", formatCRCpdf(totals.budget), formatCRCpdf(totals.aprobado),
          formatCRCpdf(totals.enProceso), formatCRCpdf(totals.disponible), `${pctTotal}%`, `${totals.tramites} trámites`,
        ]],
        headStyles: { fillColor: [26, 22, 18], textColor: [250, 245, 236], fontSize: 7.5 },
        footStyles: { fillColor: [26, 22, 18], textColor: [250, 245, 236], fontStyle: "bold", fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [26, 22, 18], minCellHeight: 9 },
        alternateRowStyles: { fillColor: [250, 245, 236] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { halign: "right", cellWidth: 32 }, 2: { halign: "right", cellWidth: 32 },
          3: { halign: "right", cellWidth: 30 }, 4: { halign: "right", cellWidth: 32 },
          5: { cellWidth: 30, halign: "center", valign: "top", cellPadding: { top: 1.5, bottom: 4, left: 1, right: 1 } },
          6: { cellWidth: 50, fontSize: 6.5, valign: "middle" },
        },
        // Barra de progreso dibujada en la parte baja de la celda % (el texto lo pone autoTable arriba)
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 5) {
            const pct = Math.min(100, parseInt(String(data.cell.raw)) || 0);
            const x = data.cell.x + 2.5;
            const bw = data.cell.width - 5;
            const barY = data.cell.y + data.cell.height - 3.2;
            doc.setFillColor(232, 216, 180); doc.roundedRect(x, barY, bw, 2, 1, 1, "F");
            doc.setFillColor(pct > 90 ? 168 : 232, pct > 90 ? 64 : 82, pct > 90 ? 32 : 26);
            doc.roundedRect(x, barY, (bw * pct) / 100, 2, 1, 1, "F");
          }
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
      {/* Resumen + descarga */}
      <div className="card card-padded mb-5">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <div><p className="caps">Presupuesto</p><p style={{ fontSize: 18, fontWeight: 700 }}>{formatCRC(totals.budget)}</p></div>
            <div><p className="caps">Aprobado</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{formatCRC(totals.aprobado)}</p></div>
            <div><p className="caps">En proceso</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--orange)" }}>{formatCRC(totals.enProceso)}</p></div>
            <div><p className="caps">Disponible</p><p style={{ fontSize: 18, fontWeight: 700 }}>{formatCRC(totals.disponible)}</p></div>
          </div>
          <button onClick={generatePDF} disabled={generating} className="btn btn-orange" style={{ flexShrink: 0 }}>
            {generating ? "Generando..." : "↓ Descargar PDF"}
          </button>
        </div>
        {/* Barra global */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="caps">Ejecución global</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{pctTotal}%</span>
          </div>
          <StackedBar budget={totals.budget} aprobado={totals.aprobado} enProceso={totals.enProceso} />
        </div>
      </div>

      {/* Distribución por tipo (todos los proyectos) */}
      <div className="card card-padded mb-6">
        <p className="section-header" style={{ marginBottom: 12 }}>
          <span className="section-dot" style={{ background: "var(--orange)" }} />
          Distribución por tipo de trámite
        </p>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12 }}>
          {typeTotals.map((t) => t.amount > 0 && (
            <div key={t.key} style={{ width: `${(t.amount / typeSum) * 100}%`, background: t.color }} title={`${t.label}: ${formatCRC(t.amount)}`} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {typeTotals.map((t) => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: t.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600 }}>{t.label} <span style={{ color: "var(--gray)", fontWeight: 400 }}>· {t.count}</span></p>
                <p style={{ fontSize: 12, color: "var(--gray)" }}>{formatCRC(t.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas por proyecto */}
      {cats.map((cat) => {
        const rows = summaries.filter((s) => s.category === cat);
        if (rows.length === 0) return null;
        return (
          <section key={cat} className="mb-8">
            <div className="section-header">
              <span className="section-dot" style={{ background: cat === "prototipado" ? "var(--orange)" : "var(--black)" }} />
              {CAT_LABEL[cat]}
              <span className="ml-auto font-normal normal-case tracking-normal">{rows.length} proyectos</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {rows.map((s) => <ProjectDetailCard key={s.id} s={s} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StackedBar({ budget, aprobado, enProceso }: { budget: number; aprobado: number; enProceso: number }) {
  const b = budget || 1;
  const pa = Math.min(100, (aprobado / b) * 100);
  const pe = Math.min(100 - pa, (enProceso / b) * 100);
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--cream-3)" }}>
      <div style={{ width: `${pa}%`, background: "var(--green)" }} />
      <div style={{ width: `${pe}%`, background: "var(--orange)" }} />
    </div>
  );
}

function ProjectDetailCard({ s }: { s: ProjectSummary }) {
  const typeSum = TYPE_META.reduce((a, tm) => a + s.byType[tm.key].amount, 0) || 1;
  return (
    <div className="card p-5">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
          <span className="caps" style={{ color: "var(--orange)", marginRight: 6 }}>#{s.id}</span>{s.name}
        </h3>
        <span className="badge badge-green" style={{ flexShrink: 0, background: s.pctEjecutado > 90 ? "#FEE2E2" : "var(--green-l)", color: s.pctEjecutado > 90 ? "#991B1B" : "var(--green)" }}>
          {s.pctEjecutado}% ejec.
        </span>
      </div>

      <StackedBar budget={s.budget} aprobado={s.aprobado} enProceso={s.enProceso} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "12px 0" }}>
        {[
          { l: "Presupuesto", v: s.budget, c: "var(--black)" },
          { l: "Aprobado", v: s.aprobado, c: "var(--green)" },
          { l: "En proceso", v: s.enProceso, c: "var(--orange)" },
          { l: "Disponible", v: s.disponible, c: s.disponible < 0 ? "var(--orange-d)" : "var(--black)" },
        ].map((x) => (
          <div key={x.l}>
            <p className="caps" style={{ fontSize: 9 }}>{x.l}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: x.c }}>{formatCRC(x.v)}</p>
          </div>
        ))}
      </div>

      {/* Desglose por tipo */}
      <div style={{ borderTop: "1px solid var(--cream-3)", paddingTop: 10 }}>
        <p className="caps" style={{ marginBottom: 8 }}>Trámites ({s.tramites})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TYPE_META.filter((tm) => s.byType[tm.key].count > 0).map((tm) => {
            const d = s.byType[tm.key];
            return (
              <div key={tm.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: tm.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, width: 78, flexShrink: 0 }}>{tm.label}</span>
                <span style={{ fontSize: 11, color: "var(--gray)", width: 18, flexShrink: 0 }}>{d.count}</span>
                <div className="pbar-wrap" style={{ flex: 1 }}>
                  <div className="pbar" style={{ width: `${(d.amount / typeSum) * 100}%`, background: tm.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, width: 92, textAlign: "right", flexShrink: 0 }}>{formatCRC(d.amount)}</span>
              </div>
            );
          })}
          {s.tramites === 0 && <p style={{ fontSize: 12, color: "var(--gray)" }}>Sin trámites registrados.</p>}
        </div>
      </div>
    </div>
  );
}
