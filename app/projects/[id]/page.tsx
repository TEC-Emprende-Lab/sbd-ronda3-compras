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
    .eq("project_id", project.id).is("deleted_at", null).order("created_at", { ascending: false });

  const all              = tramites || [];
  const gastadoAprobado  = all.filter((t) => t.status === "aprobado").reduce((s, t) => s + t.amount, 0);
  const gastadoPendiente = all.filter((t) => t.status !== "aprobado" && t.status !== "rechazado").reduce((s, t) => s + t.amount, 0);
  const disponible       = project.budget - gastadoAprobado - gastadoPendiente;
  const usedPct          = Math.min(100, ((gastadoAprobado + gastadoPendiente) / project.budget) * 100);
  const isOverBudget     = disponible < 0;
  const byStatus         = (s: TramiteStatus) => all.filter((t) => t.status === s);

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/" className="caps flex items-center gap-1 mb-2"
            style={{ color: "var(--gray)", textDecoration: "none" }}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Proyectos
          </Link>
          <h1 className="h1">{project.name}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray)" }}>
            {project.category === "prototipado" ? "Prototipado" : "Puesta en Marcha"} · Proyecto #{project.id}
          </p>
        </div>
        <Link href={`/tramites/nuevo?project=${project.id}`} className="btn btn-orange">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo trámite
        </Link>
      </div>

      {/* Budget panel */}
      <div className="card card-padded mb-6">
        <div className="grid grid-cols-4 gap-6 mb-5">
          {[
            { label: "Presupuesto total", value: formatCRC(project.budget), color: "var(--black)" },
            { label: "Gastado aprobado",  value: formatCRC(gastadoAprobado),  color: "var(--green)" },
            { label: "En proceso",        value: formatCRC(gastadoPendiente), color: "var(--orange)" },
            {
              label: "Disponible",
              value: (isOverBudget ? "−" : "") + formatCRC(Math.abs(disponible)),
              color: isOverBudget ? "var(--orange-d)" : "var(--green)",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="stat-label">{s.label}</p>
              <p className="stat-num" style={{ color: s.color, fontSize: 20 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="pbar-wrap">
          <div className={`pbar ${isOverBudget ? "pbar-red" : "pbar-orange"}`}
            style={{ width: `${Math.min(100, usedPct)}%` }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--gray)" }}>
          Disponible según los trámites registrados (los rechazados no descuentan). Puede diferir del saldo
          oficial de FUNDATEC, que además contempla comisiones, traslados y saldos de períodos anteriores.
        </p>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["en_proceso_firmas", "en_sistema_fundatec", "aprobado", "rechazado"] as TramiteStatus[]).map((s) => {
          const count = byStatus(s).length;
          if (!count) return null;
          return (
            <span key={s} className={STATUS_COLORS[s]}>
              {STATUS_LABELS[s]} · {count}
            </span>
          );
        })}
      </div>

      {/* Tramites table */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--cream-2)", background: "var(--cream-2)", borderRadius: "12px 12px 0 0" }}>
          <h2 className="h3" style={{ fontSize: 14 }}>
            Trámites <span style={{ color: "var(--gray)", fontWeight: 400 }}>({all.length})</span>
          </h2>
        </div>

        {all.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm" style={{ color: "var(--gray)" }}>No hay trámites registrados.</p>
            <Link href={`/tramites/nuevo?project=${project.id}`} className="btn btn-orange btn-sm mt-3 inline-flex">
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ttable">
              <thead>
                <tr>
                  {["Tipo", "N° Factura", "Proveedor", "Descripción", "Monto", "Fecha", "Estado", "Checklist", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
  const checked    = checkItems.filter(Boolean).length;
  const total      = checkItems.length;
  const allDone    = total > 0 && checked === total;

  const typeBadge: Record<string, string> = {
    reintegro: "badge badge-purple",
    uso_tc:    "badge badge-amber",
    factura:   "badge badge-blue",
  };

  return (
    <tr>
      <td>
        <span className={typeBadge[t.type] ?? "badge badge-gray"}>
          {TRAMITE_TYPE_LABELS[t.type as keyof typeof TRAMITE_TYPE_LABELS]}
        </span>
      </td>
      <td>
        <span className="font-mono text-xs" style={{ color: "var(--gray)" }}>
          {t.invoice_number?.slice(0, 22) ?? "—"}
        </span>
      </td>
      <td style={{ maxWidth: 130 }}>
        <span className="block truncate text-xs">{t.supplier ?? "—"}</span>
      </td>
      <td style={{ maxWidth: 160 }}>
        <span className="block truncate text-xs" style={{ color: "var(--gray)" }}>{t.description ?? "—"}</span>
      </td>
      <td className="text-right">
        <span className="text-sm font-semibold">{formatCRC(t.amount)}</span>
      </td>
      <td>
        <span className="text-xs" style={{ color: "var(--gray)" }}>
          {t.submission_date
            ? new Date(t.submission_date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" })
            : "—"}
        </span>
      </td>
      <td>
        <StatusUpdater tramiteId={t.id} currentStatus={t.status as TramiteStatus} />
      </td>
      <td>
        {total > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="pbar-wrap" style={{ width: 44 }}>
              <div className={`pbar ${allDone ? "pbar-green" : "pbar-orange"}`}
                style={{ width: `${(checked / total) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold"
              style={{ color: allDone ? "var(--green)" : "var(--gray)" }}>
              {checked}/{total}
            </span>
          </div>
        ) : <span style={{ color: "var(--gray)" }}>—</span>}
      </td>
      <td>
        <Link href={`/tramites/${t.id}`} className="text-xs font-semibold"
          style={{ color: "var(--orange)", textDecoration: "none" }}>
          Editar →
        </Link>
      </td>
    </tr>
  );
}
