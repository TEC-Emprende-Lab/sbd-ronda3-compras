import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatCRC } from "@/lib/types";
import type { Project, Tramite, TramiteStatus } from "@/lib/types";
import Link from "next/link";

interface ProjectWithStats extends Project {
  tramites: Tramite[];
  reintegrosTotal: number;
  reintegrosPendientes: number;
  disponible: number;
  enProceso: number;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("category")
    .order("name");

  const { data: tramites } = await supabase
    .from("tramites")
    .select("*")
    .order("created_at", { ascending: false });

  const tramitesByProject: Record<number, Tramite[]> = {};
  (tramites || []).forEach((t) => {
    if (!tramitesByProject[t.project_id]) tramitesByProject[t.project_id] = [];
    tramitesByProject[t.project_id].push(t);
  });

  const projectsWithStats: ProjectWithStats[] = (projects || []).map((p) => {
    const pts = tramitesByProject[p.id] || [];
    const reintegros = pts.filter((t) => t.type === "reintegro" && t.status !== "rechazado");
    const reintegrosAprobados = reintegros.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
    const reintegrosPendientes = reintegros.filter((t) => t.status !== "aprobado").reduce((s, t) => s + t.amount, 0);
    const enProceso = pts.filter((t) => t.status !== "aprobado" && t.status !== "rechazado").length;
    return {
      ...p,
      tramites: pts,
      reintegrosTotal: reintegrosAprobados,
      reintegrosPendientes,
      disponible: p.budget - reintegrosAprobados - reintegrosPendientes,
      enProceso,
    };
  });

  const prototipado = projectsWithStats.filter((p) => p.category === "prototipado");
  const puestaEnMarcha = projectsWithStats.filter((p) => p.category === "puesta_en_marcha");

  const totalBudget = projectsWithStats.reduce((s, p) => s + p.budget, 0);
  const totalUsed = projectsWithStats.reduce((s, p) => s + p.reintegrosTotal, 0);
  const totalPending = projectsWithStats.reduce((s, p) => s + p.reintegrosPendientes, 0);
  const totalTramites = (tramites || []).length;
  const totalEnProceso = (tramites || []).filter(
    (t) => t.status !== "aprobado" && t.status !== "rechazado"
  ).length;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Presupuesto total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCRC(totalBudget)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reintegros aprobados</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatCRC(totalUsed)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reintegros pendientes</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{formatCRC(totalPending)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trámites en proceso</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{totalEnProceso} / {totalTramites}</p>
        </div>
      </div>

      {/* Prototipado */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-brand-500"></span>
          Prototipado
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prototipado.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {/* Puesta en Marcha */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-purple-500"></span>
          Puesta en Marcha
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {puestaEnMarcha.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectWithStats }) {
  const usedPct = Math.min(100, ((p.reintegrosTotal + p.reintegrosPendientes) / p.budget) * 100);
  const approvedPct = Math.min(100, (p.reintegrosTotal / p.budget) * 100);

  const aprobados = p.tramites.filter((t) => t.status === "aprobado").length;
  const rechazados = p.tramites.filter((t) => t.status === "rechazado").length;

  return (
    <Link href={`/projects/${p.id}`} className="card p-5 hover:shadow-md transition-shadow block group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-mono text-gray-400">#{p.id}</span>
          <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-brand-700 transition-colors">
            {p.name}
          </h3>
        </div>
        {p.enProceso > 0 && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            {p.enProceso} en proceso
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className="absolute h-full rounded-full bg-orange-300 transition-all"
          style={{ width: `${usedPct}%` }}
        />
        <div
          className="absolute h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${approvedPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Presupuesto: <strong className="text-gray-700">{formatCRC(p.budget)}</strong></span>
        <span className="text-green-700 font-medium">{formatCRC(p.disponible)} disp.</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{p.tramites.length} trámites</span>
        {aprobados > 0 && <span className="text-green-600">✓ {aprobados} aprobados</span>}
        {rechazados > 0 && <span className="text-red-500">✗ {rechazados} rechazados</span>}
      </div>
    </Link>
  );
}
