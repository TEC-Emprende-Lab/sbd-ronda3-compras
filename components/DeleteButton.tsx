"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function DeleteButton({
  tramiteId,
  projectId,
}: {
  tramiteId: string;
  projectId: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    const supabase = createClient();
    // Soft delete: marca como eliminado sin borrar de la base de datos
    await supabase
      .from("tramites")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", tramiteId);
    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--gray)" }}>¿Enviar a papelera?</span>
        <button onClick={handleDelete} className="btn btn-sm" style={{ background: "var(--orange-d)", color: "#fff" }}>
          Sí, eliminar
        </button>
        <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn btn-ghost btn-sm"
      style={{ color: "var(--orange-d)", borderColor: "var(--orange-l)" }}>
      Eliminar
    </button>
  );
}
