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
  const isOverBudget = disponible < 0;
  const byStatus = (s: TramiteStatus) => all.filter((t) => t.status === s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-orange transition-colors uppercase tracking-wider mb-2">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Proyectos
          </Link>
          <h1 className="font-display text-2xl text-ink">{project.name}</h1>
          <p className="text-sm text-muted mt-1">
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
      <div className="card p-6">
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Presupuesto total", value: formatCRC(project.budget), color: "text-ink" },
            { label: "Gastado aprobado", value: formatCRC(gastadoAprobado), color: "text-success" },
            { label: "En proceso", value: formatCRC(gastadoPendiente), color: "text-orange" },
            { label: "Disponible", value: (isOverBudget ? "−" : "") + formatCRC(Math.abs(disponible)), color: isOverBudget ? "text-orange-d" : "text-success" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`font-display text-xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="pbar-wrap">
          <div className={`pbar ${isOverBudget ? "bg-orange-d" : "bg-orange"}`}
            style={{ width: `${Math.min(100, usedPct)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Todos los trámites aprobados descuentan del presupuesto.
        </p>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {(["en_proceso_firmas", "en_sistema_fundatec", "aprobado", "rechazado"] as TramiteStatus[]).map((s) => {
          const count = byStatus(s).length;
          if (!count) return null;
          return (
            <span key={s} className={`badge ${STATUS_COLORS[s]}`}>
              {STATUS_LABELS[s]} · {count}
            </span>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-2 bg-cream/50">
          <h2 className="font-semibold text-ink text-sm">
            Trámites <span className="text-muted font-normal">({all.length})</span>
          </h2>
        </div>

        {all.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-muted">No hay trámites registrados.</p>
            <Link href={`/tramites/nuevo?project=${project.id}`} className="mt-3 inline-flex btn-primary text-xs">
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-2/60">
                <tr>
                  {["Tipo", "N° Factura", "Proveedor", "Descripción", "Monto", "Fecha", "Estado", "Check", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-2">
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
    reintegro: "bg-purple-50 text-purple-700",
    uso_tc: "bg-amber-50 text-amber-700",
    factura: "bg-blue-50 text-blue-700",
  };

  return (
    <tr className="hover:bg-cream/60 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`badge text-[10px] ${typeColors[t.type] ?? "bg-cream-2 text-muted"}`}>
          {TRAMITE_TYPE_LABELS[t.type as keyof typeof TRAMITE_TYPE_LABELS]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[11px] text-muted">{t.invoice_number?.slice(0, 20) ?? "—"}</span>
      </td>
      <td className="px-4 py-3 max-w-[130px]">
        <span className="text-xs text-ink/70 truncate block">{t.supplier ?? "—"}</span>
      </td>
      <td className="px-4 py-3 max-w-[160px]">
        <span className="text-xs text-muted truncate block">{t.description ?? "—"}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <span className="text-xs font-semibold text-ink">{formatCRC(t.amount)}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-[11px] text-muted">
          {t.submission_date
            ? new Date(t.submission_date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" })
            : "—"}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusUpdater tramiteId={t.id} currentStatus={t.status as TramiteStatus} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {total > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="pbar-wrap" style={{ width: 48 }}>
              <div className={`pbar ${allDone ? "bg-success" : "bg-orange"}`}
                style={{ width: `${(checked / total) * 100}%` }} />
            </div>
            <span className={`text-[10px] font-semibold ${allDone ? "text-success" : "text-muted"}`}>
              {checked}/{total}
            </span>
          </div>
        ) : <span className="text-muted text-xs">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/tramites/${t.id}`} className="text-[11px] font-semibold text-orange hover:text-orange-d transition-colors">
          Editar →
        </Link>
      </td>
    </tr>
  );
}
