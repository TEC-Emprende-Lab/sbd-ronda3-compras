import { createServerSupabaseClient } from "@/lib/supabase-server";
import { TRAMITE_TYPE_LABELS } from "@/lib/types";
import ReporteClient from "@/components/ReporteClient";

export const dynamic = "force-dynamic";

export default async function ReportePage() {
  const supabase = await createServerSupabaseClient();

  // Fechas con aprobaciones
  const { data: tramites } = await supabase
    .from("tramites")
    .select("*, project:projects(id, name)")
    .eq("status", "aprobado")
    .not("approval_date", "is", null)
    .order("approval_date", { ascending: false });

  // Agrupar por fecha
  const byDate: Record<string, typeof tramites> = {};
  (tramites || []).forEach((t) => {
    const d = t.approval_date as string;
    if (!byDate[d]) byDate[d] = [];
    byDate[d]!.push(t);
  });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de sesión</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona una fecha para generar el reporte de trámites aprobados
        </p>
      </div>

      {dates.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">
          No hay trámites aprobados aún.
        </div>
      ) : (
        <ReporteClient byDate={byDate} dates={dates} />
      )}
    </div>
  );
}
