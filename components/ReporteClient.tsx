"use client";

import { useState } from "react";
import { TRAMITE_TYPE_LABELS, type TramiteType } from "@/lib/types";

interface Tramite {
  id: string;
  type: string;
  invoice_number: string | null;
  supplier: string | null;
  description: string | null;
  amount: number;
  fundatec_number: string | null;
  approval_date: string;
  project: { id: number; name: string } | null;
}

interface Props {
  byDate: Record<string, Tramite[] | null | undefined>;
  dates: string[];
}

export default function ReporteClient({ byDate, dates }: Props) {
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const [copied, setCopied] = useState(false);

  const tramites = byDate[selectedDate] ?? [];

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }

  function buildLine(t: Tramite): string {
    const tipo = t.type === "reintegro" ? "Reintegro aprobado" : "Compra aprobada";
    const tracking = t.fundatec_number ? `${t.fundatec_number} - ` : "(N° FUNDATEC) - ";
    const proyecto = t.project?.name ?? "Proyecto";
    const detalle = t.description || t.supplier
      ? [t.supplier, t.description].filter(Boolean).join(" — ")
      : t.invoice_number ?? "";
    return `* ${tracking}${proyecto}: ${detalle}`;
  }

  const compras = tramites.filter((t) => t.type !== "reintegro");
  const reintegros = tramites.filter((t) => t.type === "reintegro");

  function buildReporte(): string {
    let text = "";
    if (compras.length > 0) {
      text += "Compras aprobadas:\n\n";
      text += compras.map(buildLine).join("\n");
    }
    if (reintegros.length > 0) {
      if (text) text += "\n\n";
      text += "Reintegros aprobados:\n\n";
      text += reintegros.map(buildLine).join("\n");
    }
    return text;
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(buildReporte());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Selector de fecha */}
      <div className="card p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 shrink-0">Fecha de sesión:</label>
        <select
          className="select flex-1"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)} ({byDate[d]?.length ?? 0} trámites)
            </option>
          ))}
        </select>
      </div>

      {tramites.length === 0 ? (
        <div className="card p-6 text-center text-gray-400 text-sm">
          No hay trámites aprobados en esta fecha.
        </div>
      ) : (
        <>
          {/* Preview del reporte */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                Reporte — {formatDate(selectedDate)}
              </span>
              <button
                onClick={copyToClipboard}
                className={`btn-primary text-xs py-1.5 ${copied ? "bg-green-600 hover:bg-green-600" : ""}`}
              >
                {copied ? "✓ Copiado" : "Copiar texto"}
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-white">
              {buildReporte()}
            </pre>
          </div>

          {/* Lista editable */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                Trámites incluidos ({tramites.length})
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Proyecto</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">N° Factura</th>
                  <th className="px-4 py-2 text-left">N° FUNDATEC</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tramites.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 max-w-[180px] truncate">
                      {t.project?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        t.type === "reintegro" ? "bg-purple-100 text-purple-700"
                        : t.type === "uso_tc" ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                      }`}>
                        {TRAMITE_TYPE_LABELS[t.type as TramiteType]}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500 max-w-[160px] truncate">
                      {t.invoice_number ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {t.fundatec_number
                        ? <span className="font-medium text-brand-700">{t.fundatec_number}</span>
                        : <span className="text-orange-400 italic">Sin número</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ₡{t.amount.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
