"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { STATUS_LABELS, STATUS_COLORS, type TramiteStatus } from "@/lib/types";

const NEXT_STATUS: Record<TramiteStatus, TramiteStatus | null> = {
  en_proceso_firmas: "en_sistema_fundatec",
  en_sistema_fundatec: "aprobado",
  aprobado: null,
  rechazado: null,
};

export default function StatusUpdater({
  tramiteId,
  currentStatus,
}: {
  tramiteId: string;
  currentStatus: TramiteStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function advance() {
    const next = NEXT_STATUS[status];
    if (!next) return;
    setLoading(true);
    const supabase = createClient();
    const update: { status: TramiteStatus; approval_date?: string } = { status: next };
    if (next === "aprobado") update.approval_date = new Date().toISOString().split("T")[0];
    await supabase.from("tramites").update(update).eq("id", tramiteId);
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  async function reject() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("tramites").update({ status: "rechazado" }).eq("id", tramiteId);
    setStatus("rechazado");
    setLoading(false);
    router.refresh();
  }

  const nextStatus = NEXT_STATUS[status];

  return (
    <div className="flex items-center gap-1">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      {nextStatus && (
        <button
          onClick={advance}
          disabled={loading}
          title={`Avanzar a: ${STATUS_LABELS[nextStatus]}`}
          className="text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
      {status !== "rechazado" && status !== "aprobado" && (
        <button
          onClick={reject}
          disabled={loading}
          title="Rechazar"
          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
