import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Project, Tramite, TramiteType } from "@/lib/types";
import ReporteGeneralClient from "@/components/ReporteGeneralClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export interface TypeStat { count: number; amount: number; }

export interface ProjectSummary {
  id: number;
  name: string;
  category: string;
  budget: number;
  aprobado: number;
  enProceso: number;
  disponible: number;
  pctEjecutado: number;
  tramites: number;
  byType: Record<TramiteType, TypeStat>;
}

const EMPTY_TYPES = (): Record<TramiteType, TypeStat> => ({
  factura: { count: 0, amount: 0 },
  reintegro: { count: 0, amount: 0 },
  uso_tc: { count: 0, amount: 0 },
  comision_bancaria: { count: 0, amount: 0 },
});

export default async function ReporteGeneralPage() {
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase
    .from("projects").select("*").order("category").order("name");
  const { data: tramites } = await supabase
    .from("tramites").select("*").is("deleted_at", null);

  const byProject: Record<number, Tramite[]> = {};
  (tramites || []).forEach((t) => {
    (byProject[t.project_id] ||= []).push(t);
  });

  const summaries: ProjectSummary[] = (projects as Project[] || []).map((p) => {
    const pts = byProject[p.id] || [];
    const noRech = pts.filter((t) => t.status !== "rechazado");
    const aprobado = pts.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
    const enProceso = noRech.filter((t) => t.status !== "aprobado").reduce((s, t) => s + t.amount, 0);

    const byType = EMPTY_TYPES();
    noRech.forEach((t) => {
      const k = (t.type in byType ? t.type : "factura") as TramiteType;
      byType[k].count += 1;
      byType[k].amount += t.amount;
    });

    return {
      id: p.id, name: p.name, category: p.category, budget: p.budget,
      aprobado, enProceso,
      disponible: p.budget - aprobado - enProceso,
      pctEjecutado: p.budget > 0 ? Math.round((aprobado / p.budget) * 100) : 0,
      tramites: noRech.length,
      byType,
    };
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/reporte" className="caps flex items-center gap-1 mb-2"
            style={{ color: "var(--gray)", textDecoration: "none" }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Reportes
          </Link>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>Reporte general de proyectos</h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
            Resumen consolidado con desglose por tipo de trámite y ejecución
          </p>
        </div>
      </div>

      <ReporteGeneralClient summaries={summaries} />
    </div>
  );
}
