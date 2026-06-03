import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  formatCRC,
  STATUS_LABELS,
  STATUS_COLORS,
  TRAMITE_TYPE_LABELS,
  type Tramite,
  type TramiteStatus,
} from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusUpdater from "@/components/StatusUpdater";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", parseInt(id))
    .single();

  if (!project) notFound();

  const { data: tramites } = await supabase
    .from("tramites")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const all = tramites || [];

  const gastadoAprobado = all
    .filter((t) => t.status === "aprobado")
    .reduce((s, t) => s + t.amount, 0);

  const gastadoPendiente = all
    .filter((t) => t.status !== "aprobado" && t.status !== "rechazado")
    .reduce((s, t) => s + t.amount, 0);

  const disponible = project.budget - gastadoAprobado - gastadoPendiente;
  const usedPct = Math.min(100, ((gastadoAprobado + gastadoPendiente) / project.budget) * 100);
  const approvedPct = Math.min(100, (gastadoAprobado / project.budget) * 100);

  const byStatus = (status: TramiteStatus) => all.filter((t) => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">← Proyectos</Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className="text-sm text-gray-500 capitalize">
            {project.category === "prototipado" ? "Prototipado" : "Puesta en Marcha"} · #{project.id}
          </span>
        </div>
        <Link
          href={`/tramites/nuevo?project=${project.id}`}
          className="btn-primary shrink-0"
        >
          + Nuevo trámite
        </Link>
      </div>

      {/* Budget panel */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Presupuesto</h2>
        <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div className="absolute h-full rounded-full bg-orange-300" style={{ width: `${usedPct}%` }} />
          <div className="absolute h-full rounded-full bg-green-500" style={{ width: `${approvedPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <Stat label="Presupuesto total" value={formatCRC(project.budget)} color="text-gray-900" />
          <Stat label="Gastado aprobado" value={formatCRC(gastadoAprobado)} color="text-green-700" />
          <Stat label="En proceso" value={formatCRC(gastadoPendiente)} color="text-orange-600" />
          <Stat label="Disponible" value={formatCRC(disponible)} color={disponible < 0 ? "text-red-700 font-bold" : "text-brand-700"} />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Todos los trámites aprobados descuentan del presupuesto. Los rechazados no afectan el disponible.
        </p>
      </div>

      {/* Tramites list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Trámites ({all.length})</h2>
          <div className="flex gap-2 text-xs">
            {(["en_proceso_firmas", "en_sistema_fundatec", "aprobado", "rechazado"] as TramiteStatus[]).map((s) => {
              const count = byStatus(s).length;
              if (count === 0) return null;
              return (
                <span key={s} className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[s]}`}>
                  {STATUS_LABELS[s]} ({count})
                </span>
              );
            })}
          </div>
        </div>

        {all.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No hay trámites registrados aún.{" "}
            <Link href={`/tramites/nuevo?project=${project.id}`} className="text-brand-600 hover:underline">
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">N° Factura</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Fecha entrega</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Checklist</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {all.map((t) => (
                  <TramiteRow key={t.id} tramite={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-semibold text-base ${color}`}>{value}</p>
    </div>
  );
}

function TramiteRow({ tramite: t }: { tramite: Tramite }) {
  const checkItems = Object.values(t.checklist);
  const checked = checkItems.filter(Boolean).length;
  const total = checkItems.length;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
          t.type === "reintegro"
            ? "bg-purple-100 text-purple-700"
            : t.type === "uso_tc"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {TRAMITE_TYPE_LABELS[t.type as keyof typeof TRAMITE_TYPE_LABELS]}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
        {t.invoice_number || <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">
        {t.supplier || <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
        {t.description || <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
        {formatCRC(t.amount)}
      </td>
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
        {t.submission_date
          ? new Date(t.submission_date + "T00:00:00").toLocaleDateString("es-CR")
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusUpdater tramiteId={t.id} currentStatus={t.status as TramiteStatus} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {total > 0 ? (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${checked === total ? "bg-green-500" : "bg-orange-400"}`}
                style={{ width: `${(checked / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{checked}/{total}</span>
          </div>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link
          href={`/tramites/${t.id}`}
          className="text-xs text-brand-600 hover:underline font-medium"
        >
          Ver / Editar
        </Link>
      </td>
    </tr>
  );
}
