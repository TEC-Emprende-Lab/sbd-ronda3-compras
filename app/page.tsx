import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatCRC } from "@/lib/types";
import type { Project, Tramite } from "@/lib/types";
import Link from "next/link";

interface ProjectWithStats extends Project {
  tramites: Tramite[];
  gastadoAprobado: number;
  gastadoPendiente: number;
  disponible: number;
  enProceso: number;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase.from("projects").select("*").order("category").order("name");
  const { data: tramites } = await supabase.from("tramites").select("*");

  const tramitesByProject: Record<number, Tramite[]> = {};
  (tramites || []).forEach((t) => {
    if (!tramitesByProject[t.project_id]) tramitesByProject[t.project_id] = [];
    tramitesByProject[t.project_id].push(t);
  });

  const projectsWithStats: ProjectWithStats[] = (projects || []).map((p) => {
    const pts = tramitesByProject[p.id] || [];
    const activos = pts.filter((t) => t.status !== "rechazado");
    const gastadoAprobado = activos.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
    const gastadoPendiente = activos.filter((t) => t.status !== "aprobado").reduce((s, t) => s + t.amount, 0);
    return {
      ...p, tramites: pts, gastadoAprobado, gastadoPendiente,
      disponible: p.budget - gastadoAprobado - gastadoPendiente,
      enProceso: pts.filter((t) => t.status !== "aprobado" && t.status !== "rechazado").length,
    };
  });

  const prototipado    = projectsWithStats.filter((p) => p.category === "prototipado");
  const puestaEnMarcha = projectsWithStats.filter((p) => p.category === "puesta_en_marcha");
  const totalBudget    = projectsWithStats.reduce((s, p) => s + p.budget, 0);
  const totalUsed      = projectsWithStats.reduce((s, p) => s + p.gastadoAprobado, 0);
  const totalPending   = projectsWithStats.reduce((s, p) => s + p.gastadoPendiente, 0);
  const totalTramites  = (tramites || []).length;
  const totalEnProceso = (tramites || []).filter((t) => t.status !== "aprobado" && t.status !== "rechazado").length;
  const pctUsed        = Math.round((totalUsed / totalBudget) * 100);

  return (
    <div>
      {/* Stat cards — 60-30-10 rule: orange only for primary metric */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div className="card card-padded">
          <p className="stat-label">Presupuesto total</p>
          <p className="stat-num" style={{ color: "var(--black)" }}>{formatCRC(totalBudget)}</p>
        </div>
        <div className="card card-padded">
          <p className="stat-label">Gastado aprobado</p>
          <p className="stat-num" style={{ color: "var(--green)" }}>{formatCRC(totalUsed)}</p>
          <p className="text-xs mt-1" style={{ color: "var(--gray)" }}>{pctUsed}% ejecutado</p>
        </div>
        <div className="card card-padded">
          <p className="stat-label">En proceso</p>
          <p className="stat-num" style={{ color: "var(--orange)" }}>{formatCRC(totalPending)}</p>
        </div>
        <div className="card card-padded">
          <p className="stat-label">Trámites activos</p>
          <p className="stat-num" style={{ color: "var(--black)" }}>{totalEnProceso}</p>
          <p className="text-xs mt-1" style={{ color: "var(--gray)" }}>de {totalTramites} totales</p>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="card card-padded mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="caps">Ejecución presupuestaria global</span>
          <span className="text-sm font-semibold" style={{ color: "var(--black)" }}>{pctUsed}%</span>
        </div>
        <div className="pbar-wrap">
          <div className={`pbar ${pctUsed > 100 ? "pbar-red" : "pbar-orange"}`}
            style={{ width: `${Math.min(100, pctUsed)}%` }} />
        </div>
      </div>

      {/* Prototipado */}
      <section className="mb-10">
        <div className="section-header">
          <span className="section-dot" style={{ background: "var(--orange)" }} />
          Prototipado
          <span className="ml-auto font-normal normal-case tracking-normal">{prototipado.length} proyectos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prototipado.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {/* Puesta en Marcha */}
      <section>
        <div className="section-header">
          <span className="section-dot" style={{ background: "var(--black)" }} />
          Puesta en Marcha
          <span className="ml-auto font-normal normal-case tracking-normal">{puestaEnMarcha.length} proyectos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {puestaEnMarcha.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectWithStats }) {
  const usedPct      = Math.min(100, ((p.gastadoAprobado + p.gastadoPendiente) / p.budget) * 100);
  const isOverBudget = p.disponible < 0;
  const aprobados    = p.tramites.filter((t) => t.status === "aprobado").length;

  return (
    <Link href={`/projects/${p.id}`} className="card card-project p-5">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <span className="caps block mb-0.5" style={{ fontSize: 10 }}>#{p.id}</span>
          <h3 className="card-project-title text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--black)", transition: "color .15s" }}>
            {p.name}
          </h3>
        </div>
        {p.enProceso > 0 && (
          <span className="badge badge-orange shrink-0">{p.enProceso} en proceso</span>
        )}
      </div>

      <div className="pbar-wrap mb-2">
        <div className={`pbar ${isOverBudget ? "pbar-red" : "pbar-orange"}`}
          style={{ width: `${Math.min(100, usedPct)}%` }} />
      </div>

      <div className="flex justify-between mb-3">
        <span className="text-xs" style={{ color: "var(--gray)" }}>{formatCRC(p.budget)}</span>
        <span className="text-xs font-semibold" style={{ color: isOverBudget ? "var(--orange-d)" : "var(--green)" }}>
          {isOverBudget ? `−${formatCRC(Math.abs(p.disponible))} excedido` : `${formatCRC(p.disponible)} disp.`}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--cream-3)" }}>
        <span className="text-xs" style={{ color: "var(--gray)" }}>{p.tramites.length} trámites</span>
        {aprobados > 0 && (
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--green)" }}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {aprobados} aprobados
          </span>
        )}
      </div>
    </Link>
  );
}
