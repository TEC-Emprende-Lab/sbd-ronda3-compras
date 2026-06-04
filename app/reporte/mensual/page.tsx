import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Tramite, Project } from "@/lib/types";
import ReporteMensualClient from "@/components/ReporteMensualClient";

export const dynamic = "force-dynamic";

export interface ProjectReport extends Project {
  tramites: Tramite[];
  gastadoAprobado: number;
  gastadoPendiente: number;
  disponible: number;
}

export default async function ReporteMensualPage() {
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase
    .from("projects").select("*").order("category").order("name");

  const { data: tramites } = await supabase
    .from("tramites").select("*").is("deleted_at", null).eq("historical", false)
    .order("created_at", { ascending: true });

  const all = tramites || [];
  const byProject: Record<number, Tramite[]> = {};
  all.forEach((t) => {
    if (!byProject[t.project_id]) byProject[t.project_id] = [];
    byProject[t.project_id].push(t);
  });

  const projectReports: ProjectReport[] = (projects || []).map((p) => {
    const pts = byProject[p.id] || [];
    const activos = pts.filter((t) => t.status !== "rechazado");
    const gastadoAprobado = activos.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
    const gastadoPendiente = activos.filter((t) => t.status !== "aprobado").reduce((s, t) => s + t.amount, 0);
    return { ...p, tramites: pts, gastadoAprobado, gastadoPendiente, disponible: p.budget - gastadoAprobado - gastadoPendiente };
  });

  // Meses disponibles con trámites
  const monthSet = new Set<string>();
  all.forEach((t) => {
    const d = t.approval_date || t.submission_date || t.created_at?.substring(0, 10);
    if (d) monthSet.add(d.substring(0, 7)); // YYYY-MM
  });
  const months = Array.from(monthSet).sort().reverse();

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <a href="/reporte" className="caps flex items-center gap-1 mb-2"
            style={{ color: "var(--gray)", textDecoration: "none" }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Reporte
          </a>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>Reporte mensual de compras</h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
            Genera un PDF con el detalle de compras y reintegros por proyecto
          </p>
        </div>
      </div>

      <ReporteMensualClient
        projectReports={projectReports}
        months={months}
      />
    </div>
  );
}
