"use client";

import { useState } from "react";
import {
  TRAMITE_TYPE_LABELS, STATUS_LABELS, formatCRC,
  type TramiteType, type TramiteStatus,
} from "@/lib/types";

interface Tramite {
  id: string;
  type: string;
  status: string;
  invoice_number: string | null;
  supplier: string | null;
  description: string | null;
  amount: number;
  fundatec_number: string | null;
  approval_date: string | null;
  updated_at: string;
  project: { id: number; name: string } | null;
}

interface Props {
  byDate: Record<string, Tramite[] | null | undefined>;
  dates: string[];
}

const STATUS_BADGE: Record<string, string> = {
  en_proceso_firmas:   "badge badge-orange",
  en_sistema_fundatec: "badge badge-amber",
  aprobado:            "badge badge-green",
  rechazado:           "badge badge-red",
};

const TYPE_BADGE: Record<string, string> = {
  reintegro: "badge badge-purple",
  uso_tc:    "badge badge-amber",
  factura:   "badge badge-blue",
};

export default function ReporteClient({ byDate, dates }: Props) {
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const [copied, setCopied] = useState(false);

  const tramites = byDate[selectedDate] ?? [];
  const aprobados  = tramites.filter((t) => t.status === "aprobado");
  const pendientes = tramites.filter((t) => t.status !== "aprobado");

  function formatDate(d: string) {
    const raw = new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    return raw.replace(/ De /g, " de ");
  }

  function buildLine(t: Tramite): string {
    const tracking = t.fundatec_number ? `${t.fundatec_number} - ` : "____________ - ";
    const proyecto = t.project?.name ?? "Proyecto";
    const detalle = [t.supplier, t.description].filter(Boolean).join(" — ") || t.invoice_number || "";
    return `* ${tracking}${proyecto}: ${detalle}`;
  }

  const compras    = aprobados.filter((t) => t.type !== "reintegro");
  const reintegros = aprobados.filter((t) => t.type === "reintegro");

  function buildReporte(): string {
    let text = "";
    if (compras.length > 0) {
      text += "Compras aprobadas:\n\n" + compras.map(buildLine).join("\n");
    }
    if (reintegros.length > 0) {
      if (text) text += "\n\n";
      text += "Reintegros aprobados:\n\n" + reintegros.map(buildLine).join("\n");
    }
    return text || "Sin trámites aprobados en esta fecha.";
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(buildReporte());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function StatusCount({ status }: { status: TramiteStatus }) {
    const count = tramites.filter((t) => t.status === status).length;
    if (!count) return null;
    return <span className={STATUS_BADGE[status]}>{STATUS_LABELS[status]} · {count}</span>;
  }

  function Row({ t }: { t: Tramite }) {
    return (
      <tr>
        <td style={{ fontSize: 12, fontWeight: 600, maxWidth: 160 }}>
          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.project?.name ?? "—"}
          </span>
        </td>
        <td>
          <span className={TYPE_BADGE[t.type] ?? "badge badge-gray"} style={{ fontSize: 10 }}>
            {TRAMITE_TYPE_LABELS[t.type as TramiteType]}
          </span>
        </td>
        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gray)" }}>
          {t.invoice_number?.slice(0, 20) ?? "—"}
        </td>
        <td style={{ fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{formatCRC(t.amount)}</td>
        <td>
          <span className={STATUS_BADGE[t.status] ?? "badge badge-gray"} style={{ fontSize: 10 }}>
            {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}
          </span>
        </td>
        <td>
          {t.status === "aprobado"
            ? (t.fundatec_number
                ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)" }}>{t.fundatec_number}</span>
                : <span style={{ fontSize: 11, color: "var(--orange-d)", fontStyle: "italic" }}>Falta N°</span>)
            : <span style={{ fontSize: 11, color: "var(--gray)" }}>—</span>}
        </td>
      </tr>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Date selector */}
      <div className="card card-padded" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0,
          background: "#FEE5D8", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--orange)">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Fecha de sesión</label>
          <select className="finput" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d} value={d}>{formatDate(d)} · {byDate[d]?.length ?? 0} trámites</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <StatusCount status="aprobado" />
        <StatusCount status="en_sistema_fundatec" />
        <StatusCount status="en_proceso_firmas" />
      </div>

      {/* ── Aprobados: reporte copiable ─────────────────────── */}
      <div className="card">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--cream-2)", background: "var(--cream-2)",
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>
              Reporte de aprobados ({aprobados.length})
            </p>
            <p className="caps" style={{ marginTop: 2 }}>{formatDate(selectedDate)}</p>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={aprobados.length === 0}
            className={copied ? "btn btn-sm" : "btn btn-orange btn-sm"}
            style={copied ? { background: "var(--green)", color: "#fff" } : undefined}
          >
            {copied ? "✓ Copiado" : "Copiar texto"}
          </button>
        </div>
        {aprobados.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "var(--gray)" }}>
            No hay trámites aprobados en esta fecha.
          </div>
        ) : (
          <pre style={{
            margin: 16, padding: 16,
            background: "var(--cream)", border: "1px solid var(--cream-3)",
            borderLeft: "3px solid var(--orange)", borderRadius: "var(--radius-md)",
            fontSize: 12.5, lineHeight: 1.7, color: "var(--black)",
            fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap",
          }}>
            {buildReporte()}
          </pre>
        )}
      </div>

      {/* ── En proceso ──────────────────────────────────────── */}
      {pendientes.length > 0 && (
        <div className="card">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--cream-2)", background: "var(--cream-2)" }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>
              En proceso ({pendientes.length})
            </p>
            <p className="caps" style={{ marginTop: 2 }}>Trámites trabajados este día aún sin aprobar</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ttable">
              <thead>
                <tr>
                  {["Proyecto", "Tipo", "N° Factura", "Monto", "Estado", "N° FUNDATEC"].map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pendientes.map((t) => <Row key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detalle de aprobados ────────────────────────────── */}
      {aprobados.length > 0 && (
        <div className="card">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--cream-2)", background: "var(--cream-2)" }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>
              Detalle de aprobados ({aprobados.length})
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ttable">
              <thead>
                <tr>
                  {["Proyecto", "Tipo", "N° Factura", "Monto", "Estado", "N° FUNDATEC"].map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {aprobados.map((t) => <Row key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
