"use client";

import { useState } from "react";
import { formatCRC, formatCRCpdf, TRAMITE_TYPE_LABELS, STATUS_LABELS, type TramiteType } from "@/lib/types";
import { loadLogoDataUrl, LOGO_RATIO } from "@/lib/pdf-utils";
import type { ProjectReport } from "@/app/reporte/mensual/page";

interface Props {
  projectReports: ProjectReport[];
  months: string[];
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
};

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[m] ?? m} ${y}`;
}

function formatDateShort(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function ReporteMensualClient({ projectReports, months }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? "");
  const [generating, setGenerating] = useState(false);

  // Filtrar trámites del mes seleccionado para cada proyecto
  const filtered: ProjectReport[] = projectReports.map((p) => ({
    ...p,
    tramites: p.tramites.filter((t) => {
      const d = t.approval_date || t.submission_date || t.created_at?.substring(0, 10);
      return d?.startsWith(selectedMonth);
    }),
  })).filter((p) => p.tramites.length > 0);

  const totalTramites = filtered.reduce((s, p) => s + p.tramites.length, 0);
  const totalMonto    = filtered.reduce((s, p) => s + p.tramites.reduce((ss, t) => ss + t.amount, 0), 0);

  async function generatePDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const logo = await loadLogoDataUrl();

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const monthLabel = formatMonth(selectedMonth);
      const today = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });

      // ── Encabezado ─────────────────────────────────────────
      doc.setFillColor(26, 22, 18);
      doc.rect(0, 0, W, 28, "F");

      // Logo
      if (logo) {
        const h = 12; doc.addImage(logo, "PNG", 10, 8, h * LOGO_RATIO, h);
      } else {
        doc.setFillColor(232, 82, 26);
        doc.roundedRect(10, 7, 14, 14, 2, 2, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text("T", 17, 17, { align: "center" });
        doc.setFontSize(12); doc.text("TEC EMPRENDE Lab", 28, 14);
      }

      // Título reporte
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Reporte Mensual — ${monthLabel}`, W / 2, 13, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(179, 168, 146);
      doc.text(`Generado: ${today}`, W / 2, 21, { align: "center" });

      // Info derecha
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalTramites} trámites`, W - 12, 13, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(formatCRCpdf(totalMonto), W - 12, 21, { align: "right" });

      let y = 36;

      // ── Por proyecto ────────────────────────────────────────
      for (const project of filtered) {
        const projMonto = project.tramites.reduce((s, t) => s + t.amount, 0);

        // Verificar si hay espacio en la página
        if (y > 170) { doc.addPage(); y = 16; }

        // Encabezado proyecto
        doc.setFillColor(242, 232, 208);
        doc.roundedRect(10, y, W - 20, 12, 2, 2, "F");

        doc.setFillColor(232, 82, 26);
        doc.roundedRect(10, y, 3, 12, 1, 1, "F");

        doc.setTextColor(26, 22, 18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${project.name}  #${project.id}`, 17, y + 5.5);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(110, 101, 83);
        const catLabel = project.category === "prototipado" ? "Prototipado" : "Puesta en Marcha";
        doc.text(`${catLabel}  ·  Presupuesto: ${formatCRCpdf(project.budget)}  ·  Mes: ${formatCRCpdf(projMonto)}`, 17, y + 10);

        y += 16;

        // Tabla de trámites
        autoTable(doc, {
          startY: y,
          margin: { left: 10, right: 10 },
          head: [["Tipo", "N° Factura / Doc.", "Proveedor", "Descripción", "Monto (₡)", "Estado", "Fecha"]],
          body: project.tramites.map((t) => [
            TRAMITE_TYPE_LABELS[t.type as TramiteType] ?? t.type,
            t.invoice_number?.slice(0, 24) ?? "—",
            t.supplier?.slice(0, 25) ?? "—",
            t.description?.slice(0, 35) ?? "—",
            formatCRCpdf(t.amount),
            STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] ?? t.status,
            formatDateShort(t.approval_date || t.submission_date),
          ]),
          foot: [[
            { content: "SUBTOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
            { content: formatCRCpdf(projMonto), styles: { fontStyle: "bold" } },
            "", "",
          ]],
          headStyles: {
            fillColor: [26, 22, 18], textColor: [250, 245, 236],
            fontSize: 7, fontStyle: "bold", halign: "left",
          },
          bodyStyles: { fontSize: 7.5, textColor: [26, 22, 18] },
          footStyles: { fillColor: [250, 245, 236], textColor: [26, 22, 18], fontSize: 8 },
          alternateRowStyles: { fillColor: [250, 245, 236] },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 48, font: "courier", fontSize: 6.5 },
            2: { cellWidth: 40 },
            3: { cellWidth: 55 },
            4: { cellWidth: 30, halign: "right" },
            5: { cellWidth: 35 },
            6: { cellWidth: 22, halign: "center" },
          },
          didDrawPage: (data) => { y = data.cursor?.y ?? y; },
        });

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }

      // ── Pie de página en cada hoja ──────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(26, 22, 18);
        doc.rect(0, doc.internal.pageSize.getHeight() - 8, W, 8, "F");
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(179, 168, 146);
        doc.text("TEC Emprende Lab · Control de Compras SBD Ronda 3", 10, doc.internal.pageSize.getHeight() - 3);
        doc.text(`Página ${i} de ${pageCount}`, W - 10, doc.internal.pageSize.getHeight() - 3, { align: "right" });
      }

      const filename = `Reporte_Compras_${selectedMonth.replace("-", "_")}.pdf`;
      doc.save(filename);
    } finally {
      setGenerating(false);
    }
  }

  const typeColors: Record<string, string> = {
    reintegro: "badge badge-purple",
    uso_tc:    "badge badge-amber",
    factura:   "badge badge-blue",
  };

  return (
    <div>
      {/* Controles */}
      <div className="card card-padded mb-6" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Mes del reporte</label>
          <select className="finput" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p className="caps" style={{ marginBottom: 4 }}>
            {filtered.length} proyectos · {totalTramites} trámites
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--black)" }}>{formatCRC(totalMonto)}</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating || filtered.length === 0}
          className="btn btn-orange"
          style={{ flexShrink: 0, minWidth: 160 }}
        >
          {generating ? (
            "Generando PDF..."
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      {filtered.length === 0 ? (
        <div className="card card-padded" style={{ textAlign: "center", color: "var(--gray)" }}>
          No hay trámites registrados en {formatMonth(selectedMonth)}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((project) => {
            const projMonto = project.tramites.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={project.id} className="card">
                {/* Project header */}
                <div style={{
                  padding: "14px 20px", background: "var(--cream-2)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <span className="caps" style={{ color: "var(--orange)", marginRight: 8 }}>#{project.id}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--black)" }}>{project.name}</span>
                    <span className="caps" style={{ marginLeft: 12 }}>
                      {project.category === "prototipado" ? "Prototipado" : "Puesta en Marcha"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="caps">Total del mes</p>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--black)" }}>{formatCRC(projMonto)}</p>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                  <table className="ttable">
                    <thead>
                      <tr>
                        {["Tipo", "N° Factura", "Proveedor", "Descripción", "Monto", "Estado", "Fecha"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {project.tramites.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <span className={typeColors[t.type] ?? "badge badge-gray"} style={{ fontSize: 10 }}>
                              {TRAMITE_TYPE_LABELS[t.type as TramiteType]}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gray)" }}>
                            {t.invoice_number?.slice(0, 22) ?? "—"}
                          </td>
                          <td style={{ fontSize: 12 }}>{t.supplier ?? "—"}</td>
                          <td style={{ fontSize: 12, color: "var(--gray)", maxWidth: 200 }}>
                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.description ?? "—"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>
                            {formatCRC(t.amount)}
                          </td>
                          <td>
                            <span className={
                              t.status === "aprobado" ? "badge badge-green" :
                              t.status === "rechazado" ? "badge badge-red" :
                              t.status === "en_sistema_fundatec" ? "badge badge-amber" :
                              "badge badge-orange"
                            } style={{ fontSize: 10 }}>
                              {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: "var(--gray)", whiteSpace: "nowrap" }}>
                            {formatDateShort(t.approval_date || t.submission_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "var(--cream-2)" }}>
                        <td colSpan={4} style={{ textAlign: "right", fontWeight: 600, fontSize: 12, padding: "10px 14px" }}>
                          Subtotal mes
                        </td>
                        <td style={{ fontWeight: 700, fontSize: 13, color: "var(--orange)", padding: "10px 14px", textAlign: "right" }}>
                          {formatCRC(projMonto)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
