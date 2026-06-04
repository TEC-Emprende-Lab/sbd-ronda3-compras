import { createServerSupabaseClient } from "@/lib/supabase-server";
import ReporteClient from "@/components/ReporteClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportePage() {
  const supabase = await createServerSupabaseClient();

  // Todos los trámites no rechazados, con su proyecto
  const { data: tramites } = await supabase
    .from("tramites")
    .select("*, project:projects(id, name)")
    .neq("status", "rechazado")
    .order("updated_at", { ascending: false });

  // Fecha de actividad: approval_date si está aprobado, si no la fecha de
  // última modificación (cuándo se cambió de estado por última vez).
  const activityDate = (t: { status: string; approval_date: string | null; updated_at: string }) => {
    if (t.status === "aprobado" && t.approval_date) return t.approval_date;
    return (t.updated_at || "").substring(0, 10);
  };

  const byDate: Record<string, typeof tramites> = {};
  (tramites || []).forEach((t) => {
    const d = activityDate(t);
    if (!d) return;
    if (!byDate[d]) byDate[d] = [];
    byDate[d]!.push(t);
  });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>Reporte de sesión</h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
            Actividad por día — aprobados y trámites en proceso con su estado
          </p>
        </div>
        <Link href="/reporte/mensual" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
          Reporte mensual →
        </Link>
      </div>

      {dates.length === 0 ? (
        <div className="card card-padded" style={{ textAlign: "center", color: "var(--gray)" }}>
          No hay trámites registrados aún.
        </div>
      ) : (
        <ReporteClient byDate={byDate} dates={dates} />
      )}
    </div>
  );
}
