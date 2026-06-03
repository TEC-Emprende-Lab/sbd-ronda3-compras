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

  const { data: projects } = await supabase
    .from("projects").select("*").order("category").order("name");

  const { data: tramites } = await supabase
    .from("tramites").select("*").order("created_at", { ascending: false });

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
      {/* Hero stats */}
      <div className="rounded-3xl bg-navy p-8 shadow-glass">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-600 uppercase tracking-widest text-white/40">Presupuesto total</p>
            <p className="text-4xl font-800 text-white tracking-tight mt-1">{formatCRC(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-600 uppercase tracking-widest text-white/40">Ejecución</p>
            <p className="text-4xl font-800 text-brand tracking-tight mt-1">{pctUsed}%</p>
          </div>
        </div>
        {/* Global budget bar */}
        <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden mb-6">
          <div className="absolute h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${Math.min(100, pctUsed)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs font-600 uppercase tracking-wider text-white/40">Gastado aprobado</p>
            <p className="text-xl font-700 text-green-400 mt-1">{formatCRC(totalUsed)}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs font-600 uppercase tracking-wider text-white/40">En proceso</p>
            <p className="text-xl font-700 text-gold mt-1">{formatCRC(totalPending)}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs font-600 uppercase tracking-wider text-white/40">Trámites activos</p>
            <p className="text-xl font-700 text-white mt-1">{totalEnProceso} <span className="text-white/40 text-sm font-500">/ {totalTramites}</span></p>
          </div>
        </div>
      </div>

      {/* Prototipado */}
      <section>
        <div className="section-title">
          <span className="h-2 w-2 rounded-full bg-brand inline-block" />
          Prototipado
          <span className="ml-auto text-xs font-500 normal-case tracking-normal text-navy/40">{prototipado.length} proyectos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prototipado.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {/* Puesta en Marcha */}
      <section>
        <div className="section-title">
          <span className="h-2 w-2 rounded-full bg-gold inline-block" />
          Puesta en Marcha
          <span className="ml-auto text-xs font-500 normal-case tracking-normal text-navy/40">{puestaEnMarcha.length} proyectos</span>
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
  const approvedPct = Math.min(100, (p.gastadoAprobado / p.budget) * 100);
  const isOverBudget = p.disponible < 0;
  const aprobados = p.tramites.filter((t) => t.status === "aprobado").length;

  return (
    <Link href={`/projects/${p.id}`} className="card p-5 hover:shadow-glass transition-all duration-300 block group border-2 border-transparent hover:border-brand/20">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-700 tracking-widest text-navy/30 uppercase">#{p.id}</span>
          <h3 className="font-700 text-navy leading-snug group-hover:text-brand transition-colors duration-200 text-sm mt-0.5 line-clamp-2">
            {p.name}
          </h3>
        </div>
        {p.enProceso > 0 && (
          <span className="shrink-0 badge bg-brand/10 text-brand">
            {p.enProceso} en proceso
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div className="relative h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
        <div className={`absolute h-full rounded-full transition-all duration-500 ${isOverBudget ? "bg-red-400" : "bg-gold/60"}`}
          style={{ width: `${Math.min(100, usedPct)}%` }} />
        <div className="absolute h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${approvedPct}%` }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-navy/50 font-500">{formatCRC(p.budget)}</span>
        <span className={`text-xs font-700 ${isOverBudget ? "text-red-500" : "text-green-600"}`}>
          {isOverBudget ? "−" : ""}{formatCRC(Math.abs(p.disponible))} {isOverBudget ? "excedido" : "disp."}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-navy/40 font-500">{p.tramites.length} trámites</span>
        {aprobados > 0 && (
          <span className="text-xs text-green-600 font-600 flex items-center gap-1">
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
