import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  formatCRC, STATUS_LABELS, STATUS_COLORS, TRAMITE_TYPE_LABELS,
  type Tramite, type TramiteStatus,
} from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusUpdater from "@/components/StatusUpdater";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", parseInt(id)).single();
  if (!project) notFound();

  const { data: tramites } = await supabase.from("tramites").select("*")
    .eq("project_id", project.id).order("created_at", { ascending: false });

  const all = tramites || [];
  const gastadoAprobado = all.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
  const gastadoPendiente = all.filter((t) => t.status !== "aprobado" && t.status !== "rechazado").reduce((s, t) => s + t.amount, 0);
  const disponible = project.budget - gastadoAprobado - gastadoPendiente;
  const usedPct = Math.min(100, ((gastadoAprobado + gastadoPendiente) / project.budget) * 100);
  const approvedPct = Math.min(100, (gastadoAprobado / project.budget) * 100);
  const isOverBudget = disponible < 0;

  const byStatus = (s: TramiteStatus) => all.filter((t) => t.status === s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-600 text-navy/40 hover:text-brand transition-colors uppercase tracking-wider mb-2">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Proyectos
          </Link>
          <h1 className="text-2xl font-800 text-navy tracking-tight">{project.name}</h1>
          <p className="text-sm text-navy/40 font-500 mt-1">
            {project.category === "prototipado" ? "Prototipado" : "Puesta en Marcha"} · Proyecto #{project.id}
          </p>
        </div>
        <Link href={`/tramites/nuevo?project=${project.id}`} className="btn-primary shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo trámite
        </Link>
      </div>

      {/* Budget panel */}
      <div className="rounded-3xl bg-navy p-6 shadow-glass">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Presupuesto total", value: formatCRC(project.budget), color: "text-white" },
            { label: "Gastado aprobado", value: formatCRC(gastadoAprobado), color: "text-green-400" },
            { label: "En proceso", value: formatCRC(gastadoPendiente), color: "text-gold" },
            { label: "Disponible", value: formatCRC(Math.abs(disponible)), color: isOverBudget ? "text-red-400" : "text-brand" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-600 uppercase tracking-wider text-white/40">{s.label}</p>
              <p className={`text-lg font-700 mt-1 ${s.color}`}>
                {isOverBudget && s.label === "Disponible" ? "−" : ""}{s.value}
              </p>
            </div>
          ))}
        </div>
        <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`absolute h-full rounded-full transition-all ${isOverBudget ? "bg-red-400" : "bg-gold/50"}`}
            style={{ width: `${usedPct}%` }} />
          <div className="absolute h-full rounded-full bg-brand" style={{ width: `${approvedPct}%` }} />
        </div>
        <p className="mt-3 text-[10px] font-500 text-white/30">
          Todos los trámites aprobados descuentan del presupuesto. Los rechazados no afectan el disponible.
        </p>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {(["en_proceso_firmas", "en_sistema_fundatec", "aprobado", "rechazado"] as TramiteStatus[]).map((s) => {
          const count = byStatus(s).length;
          if (!count) return null;
          return (
            <span key={s} className={`badge ${STATUS_COLORS[s]} gap-1.5 px-3 py-1`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
              {STATUS_LABELS[s]} · {count}
            </span>
          );
        })}
      </div>

      {/* Tramites table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-700 text-navy text-sm">Trámites <span className="text-navy/40 font-500">({all.length})</span></h2>
        </div>

        {all.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-sm text-navy/40 font-500">No hay trámites registrados.</p>
            <Link href={`/tramites/nuevo?project=${project.id}`} className="mt-3 inline-flex btn-primary text-xs">
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  {["Tipo", "N° Factura", "Proveedor", "Descripción", "Monto", "Fecha", "Estado", "Check", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-700 uppercase tracking-wider text-navy/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {all.map((t) => <TramiteRow key={t.id} tramite={t} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TramiteRow({ tramite: t }: { tramite: Tramite }) {
  const checkItems = Object.values(t.checklist || {});
  const checked = checkItems.filter(Boolean).length;
  const total = checkItems.length;
  const allDone = total > 0 && checked === total;

  const typeColors: Record<string, string> = {
    reintegro: "bg-purple-50 text-purple-700 border border-purple-100",
    uso_tc: "bg-amber-50 text-amber-700 border border-amber-100",
    factura: "bg-blue-50 text-blue-700 border border-blue-100",
  };

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`badge text-[10px] ${typeColors[t.type] ?? "bg-gray-50 text-gray-600"}`}>
          {TRAMITE_TYPE_LABELS[t.type as keyof typeof TRAMITE_TYPE_LABELS]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[11px] text-navy/50 tracking-wide">
          {t.invoice_number ? t.invoice_number.slice(0, 20) : <span className="text-navy/20">—</span>}
        </span>
      </td>
      <td className="px-4 py-3 max-w-[130px]">
        <span className="text-xs font-500 text-navy/70 truncate block">{t.supplier ?? <span className="text-navy/20">—</span>}</span>
      </td>
      <td className="px-4 py-3 max-w-[160px]">
        <span className="text-xs text-navy/50 truncate block">{t.description ?? <span className="text-navy/20">—</span>}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <span className="text-xs font-700 text-navy">{formatCRC(t.amount)}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-[11px] text-navy/40 font-500">
          {t.submission_date
            ? new Date(t.submission_date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" })
            : <span className="text-navy/20">—</span>}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusUpdater tramiteId={t.id} currentStatus={t.status as TramiteStatus} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {total > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-14 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-brand"}`}
                style={{ width: `${(checked / total) * 100}%` }} />
            </div>
            <span className={`text-[10px] font-700 ${allDone ? "text-green-600" : "text-navy/40"}`}>
              {checked}/{total}
            </span>
          </div>
        ) : <span className="text-navy/20 text-xs">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/tramites/${t.id}`} className="text-[11px] font-600 text-brand hover:text-brand-dark transition-colors">
          Editar →
        </Link>
      </td>
    </tr>
  );
}
