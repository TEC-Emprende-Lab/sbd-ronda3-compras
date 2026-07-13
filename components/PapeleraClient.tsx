"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatCRC, TRAMITE_TYPE_LABELS, type TramiteType } from "@/lib/types";

interface Tramite {
  id: string;
  type: string;
  status: string;
  invoice_number: string | null;
  supplier: string | null;
  description: string | null;
  amount: number;
  deleted_at: string;
  project: { id: number; name: string } | null;
}

const TYPE_BADGE: Record<string, string> = {
  reintegro: "badge badge-purple",
  uso_tc:    "badge badge-amber",
  factura:   "badge badge-blue",
  pago_contrato: "badge badge-green",
};

export default function PapeleraClient({ tramites }: { tramites: Tramite[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmPurgeId, setConfirmPurgeId] = useState<string | null>(null);

  async function restore(id: string) {
    setBusyId(id);
    const supabase = createClient();
    await supabase.from("tramites").update({ deleted_at: null }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function purge(id: string) {
    setBusyId(id);
    const supabase = createClient();
    await supabase.from("tramites").delete().eq("id", id);
    setBusyId(null);
    setConfirmPurgeId(null);
    router.refresh();
  }

  if (tramites.length === 0) {
    return (
      <div className="card card-padded" style={{ textAlign: "center", color: "var(--gray)" }}>
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="var(--cream-3)"
          style={{ margin: "0 auto 8px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        <p style={{ fontSize: 13 }}>La papelera está vacía.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--cream-2)", background: "var(--cream-2)" }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>
          {tramites.length} {tramites.length === 1 ? "trámite eliminado" : "trámites eliminados"}
        </p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="ttable">
          <thead>
            <tr>
              {["Proyecto", "Tipo", "N° Factura", "Proveedor", "Monto", "Eliminado", "Acciones"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tramites.map((t) => (
              <tr key={t.id}>
                <td style={{ fontSize: 12, fontWeight: 600, maxWidth: 150 }}>
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
                <td style={{ fontSize: 12, maxWidth: 120 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.supplier ?? "—"}
                  </span>
                </td>
                <td style={{ fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{formatCRC(t.amount)}</td>
                <td style={{ fontSize: 11, color: "var(--gray)", whiteSpace: "nowrap" }}>
                  {new Date(t.deleted_at).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {confirmPurgeId === t.id ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--orange-d)" }}>¿Borrar para siempre?</span>
                      <button onClick={() => purge(t.id)} disabled={busyId === t.id}
                        style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "var(--orange-d)", border: "none", borderRadius: "var(--radius-sm)", padding: "3px 8px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        {busyId === t.id ? "..." : "Sí"}
                      </button>
                      <button onClick={() => setConfirmPurgeId(null)}
                        style={{ fontSize: 11, color: "var(--gray)", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "3px 8px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        No
                      </button>
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => restore(t.id)} disabled={busyId === t.id}
                        style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                        Restaurar
                      </button>
                      <button onClick={() => setConfirmPurgeId(t.id)}
                        style={{ fontSize: 12, color: "var(--gray)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        Borrar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
