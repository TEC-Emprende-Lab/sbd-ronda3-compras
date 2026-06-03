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
    await supabase.from("tramites").delete().eq("id", tramiteId);
    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">¿Eliminar?</span>
        <button onClick={handleDelete} className="btn-danger text-xs px-3 py-1.5">
          Sí, eliminar
        </button>
        <button onClick={() => setConfirming(false)} className="btn-secondary text-xs px-3 py-1.5">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-secondary text-xs text-red-600 border-red-200 hover:bg-red-50">
      Eliminar
    </button>
  );
}
