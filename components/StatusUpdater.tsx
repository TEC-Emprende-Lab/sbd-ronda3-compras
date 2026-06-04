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
  const [askingFundatec, setAskingFundatec] = useState(false);
  const [fundatecNumber, setFundatecNumber] = useState("");

  const nextStatus = NEXT_STATUS[status];

  async function handleAdvance() {
    if (nextStatus === "aprobado") {
      setAskingFundatec(true);
      return;
    }
    await applyStatus(nextStatus!, null);
  }

  async function handleApprove() {
    await applyStatus("aprobado", fundatecNumber || null);
    setAskingFundatec(false);
    setFundatecNumber("");
  }

  async function applyStatus(newStatus: TramiteStatus, fundatecNum: string | null) {
    setLoading(true);
    const supabase = createClient();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "aprobado") {
      update.approval_date = new Date().toISOString().split("T")[0];
      if (fundatecNum) update.fundatec_number = fundatecNum;
    }
    await supabase.from("tramites").update(update).eq("id", tramiteId);
    setStatus(newStatus);
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

  if (askingFundatec) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={fundatecNumber}
          onChange={(e) => setFundatecNumber(e.target.value)}
          placeholder="N° FUNDATEC (opcional)"
          className="finput text-xs w-40"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleApprove(); if (e.key === "Escape") setAskingFundatec(false); }}
        />
        <button
          onClick={handleApprove}
          disabled={loading}
          className="text-xs bg-green-600 text-white rounded px-2 py-1 hover:bg-green-700 disabled:opacity-50"
        >
          ✓
        </button>
        <button
          onClick={() => setAskingFundatec(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className={STATUS_COLORS[status]} style={{ fontSize: 10 }}>
        {STATUS_LABELS[status]}
      </span>
      {nextStatus && (
        <button
          onClick={handleAdvance}
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
