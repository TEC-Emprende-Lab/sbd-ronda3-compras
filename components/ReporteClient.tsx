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
    const raw = new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    // Fix: toLocaleDateString capitalizes prepositions in some browsers
    return raw.replace(/ De /g, " de ");
  }

  function buildLine(t: Tramite): string {
    const tracking = t.fundatec_number ? `${t.fundatec_number} - ` : "____________ - ";
    const proyecto = t.project?.name ?? "Proyecto";
    const detalle = [t.supplier, t.description].filter(Boolean).join(" — ") || t.invoice_number || "";
    return `* ${tracking}${proyecto}: ${detalle}`;
  }

  const compras = tramites.filter((t) => t.type !== "reintegro");
  const reintegros = tramites.filter((t) => t.type === "reintegro");

  function buildReporte(): string {
    let text = "";
    if (compras.length > 0) {
      text += "Compras aprobadas:\n\n" + compras.map(buildLine).join("\n");
    }
    if (reintegros.length > 0) {
      if (text) text += "\n\n";
      text += "Reintegros aprobados:\n\n" + reintegros.map(buildLine).join("\n");
    }
    return text;
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(buildReporte());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const typeColors: Record<string, string> = {
    reintegro: "bg-purple-50 text-purple-700 border border-purple-100",
    uso_tc: "bg-amber-50 text-amber-700 border border-amber-100",
    factura: "bg-blue-50 text-blue-700 border border-blue-100",
  };

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="card p-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 shrink-0">
          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div className="flex-1">
          <label className="label">Fecha de sesión</label>
          <select className="select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)} · {byDate[d]?.length ?? 0} trámites
              </option>
            ))}
          </select>
        </div>
      </div>

      {tramites.length === 0 ? (
        <div className="card p-10 text-center text-navy/30 text-sm font-500">No hay trámites aprobados en esta fecha.</div>
      ) : (
        <>
          {/* Report preview */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <div>
                <p className="text-sm font-700 text-navy">Reporte de sesión</p>
                <p className="text-xs text-navy/40 font-500 mt-0.5 capitalize">{formatDate(selectedDate)}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-600 transition-all duration-200 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-brand text-white hover:bg-brand-dark shadow-glow"
                }`}
              >
                {copied ? (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>Copiado</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>Copiar texto</>
                )}
              </button>
            </div>
            <pre className="p-5 text-sm text-navy/80 whitespace-pre-wrap font-mono leading-relaxed bg-white border-l-4 border-brand/20 ml-5 my-4 mr-5 rounded-xl bg-gray-50/50">
              {buildReporte()}
            </pre>
          </div>

          {/* Tramites table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-700 text-navy">Trámites incluidos <span className="text-navy/40 font-500">({tramites.length})</span></p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  {["Proyecto", "Tipo", "N° Factura", "N° FUNDATEC", "Monto"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-700 uppercase tracking-wider text-navy/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tramites.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-600 text-navy text-xs max-w-[180px] truncate">{t.project?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${typeColors[t.type] ?? "bg-gray-50 text-gray-600"}`}>
                        {TRAMITE_TYPE_LABELS[t.type as TramiteType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-navy/40">{t.invoice_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      {t.fundatec_number
                        ? <span className="text-xs font-700 text-brand">{t.fundatec_number}</span>
                        : <span className="text-[11px] text-amber-500 font-500 italic">Sin número</span>}
                    </td>
                    <td className="px-4 py-3 font-700 text-navy text-xs">
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
