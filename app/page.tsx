import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatCRC } from "@/lib/types";
import type { Project, Tramite, TramiteStatus } from "@/lib/types";
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
  const { data: tramites } = await supabase.from("tramites").select("*").order("created_at", { ascending: false });

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

  const prototipado = projectsWithStats.filter((p) => p.category === "prototipado");
  const puestaEnMarcha = projectsWithStats.filter((p) => p.category === "puesta_en_marcha");
  const totalBudget = projectsWithStats.reduce((s, p) => s + p.budget, 0);
  const totalUsed = projectsWithStats.reduce((s, p) => s + p.gastadoAprobado, 0);
  const totalPending = projectsWithStats.reduce((s, p) => s + p.gastadoPendiente, 0);
  const totalTramites = (tramites || []).length;
  const totalEnProceso = (tramites || []).filter((t) => t.status !== "aprobado" && t.status !== "rechazado").length;
  const pctUsed = Math.round((totalUsed / totalBudget) * 100);

  return (
    <div className="space-y-10">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Presupuesto total", value: formatCRC(totalBudget), color: "text-ink" },
          { label: "Gastado aprobado", value: formatCRC(totalUsed), sub: `${pctUsed}% ejecutado`, color: "text-success" },
          { label: "En proceso", value: formatCRC(totalPending), color: "text-orange" },
          { label: "Trámites activos", value: `${totalEnProceso}`, sub: `de ${totalTramites} totales`, color: "text-ink" },
        ].map((s) => (
          <div key={s.label} className="card-padded">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-num ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-muted mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      <div className="card-padded">
        <div className="flex justify-between text-xs text-muted mb-2">
          <span>Ejecución presupuestaria global</span>
          <span className="font-semibold text-ink">{pctUsed}%</span>
        </div>
        <div className="pbar-wrap">
          <div className="pbar bg-orange" style={{ width: `${Math.min(100, pctUsed)}%` }} />
        </div>
      </div>

      {/* Prototipado */}
      <section>
        <div className="section-title">
          <span className="h-1.5 w-1.5 rounded-full bg-orange inline-block" />
          Prototipado
          <span className="ml-auto normal-case tracking-normal font-normal">{prototipado.length} proyectos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prototipado.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {/* Puesta en Marcha */}
      <section>
        <div className="section-title">
          <span className="h-1.5 w-1.5 rounded-full bg-ink inline-block" />
          Puesta en Marcha
          <span className="ml-auto normal-case tracking-normal font-normal">{puestaEnMarcha.length} proyectos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {puestaEnMarcha.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectWithStats }) {
  const usedPct = Math.min(100, ((p.gastadoAprobado + p.gastadoPendiente) / p.budget) * 100);
  const isOverBudget = p.disponible < 0;
  const aprobados = p.tramites.filter((t) => t.status === "aprobado").length;

  return (
    <Link href={`/projects/${p.id}`} className="card block p-5 hover:border-orange/40 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold tracking-widest text-muted uppercase">#{p.id}</span>
          <h3 className="font-display text-base text-ink group-hover:text-orange transition-colors leading-snug mt-0.5 line-clamp-2">
            {p.name}
          </h3>
        </div>
        {p.enProceso > 0 && (
          <span className="shrink-0 badge bg-orange/10 text-orange-d border border-orange/20">
            {p.enProceso} en proceso
          </span>
        )}
      </div>

      <div className="pbar-wrap mb-2">
        <div className={`pbar ${isOverBudget ? "bg-orange-d" : "bg-orange"}`}
          style={{ width: `${Math.min(100, usedPct)}%` }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">{formatCRC(p.budget)}</span>
        <span className={`text-xs font-semibold ${isOverBudget ? "text-orange-d" : "text-success"}`}>
          {isOverBudget ? `−${formatCRC(Math.abs(p.disponible))} excedido` : `${formatCRC(p.disponible)} disp.`}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-cream-3">
        <span className="text-xs text-muted">{p.tramites.length} trámites</span>
        {aprobados > 0 && (
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {aprobados} aprobados
          </span>
        )}
      </div>
    </Link>
  );
}
