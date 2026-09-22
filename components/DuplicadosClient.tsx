"use client";

import { useMemo } from "react";
import Link from "next/link";

type Row = {
  id: string;
  project_id: number;
  invoice_number: string | null;
  supplier: string | null;
  amount: number;
  approval_date: string | null;
  status: string;
  project: { id: number; name: string } | { id: number; name: string }[] | null;
};

function projectName(project: Row["project"]): string {
  if (!project) return "—";
  return Array.isArray(project) ? project[0]?.name ?? "—" : project.name;
}

function normalizeSupplier(s: string | null): string {
  return (s ?? "").trim().toUpperCase().replace(/\s+/g, " ");
}

const fmt = (n: number) =>
  n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DuplicadosClient({ tramites }: { tramites: Row[] }) {
  const { byInvoice, bySupplierAmount } = useMemo(() => {
    const invoiceGroups = new Map<string, Row[]>();
    for (const t of tramites) {
      const key = (t.invoice_number ?? "").trim();
      if (!key) continue;
      if (!invoiceGroups.has(key)) invoiceGroups.set(key, []);
      invoiceGroups.get(key)!.push(t);
    }
    const byInvoice = Array.from(invoiceGroups.entries()).filter(([, rows]) => rows.length > 1);

    const saGroups = new Map<string, Row[]>();
    for (const t of tramites) {
      const supplier = normalizeSupplier(t.supplier);
      if (!supplier) continue;
      const key = `${supplier}__${Number(t.amount).toFixed(2)}`;
      if (!saGroups.has(key)) saGroups.set(key, []);
      saGroups.get(key)!.push(t);
    }
    // Solo los que NO comparten ya el mismo número de factura (esos ya
    // salen en byInvoice) — así no se duplica el aviso.
    const bySupplierAmount = Array.from(saGroups.entries()).filter(([, rows]) => {
      if (rows.length < 2) return false;
      const invoiceNumbers = new Set(rows.map((r: Row) => (r.invoice_number ?? "").trim()));
      return invoiceNumbers.size > 1;
    });

    return { byInvoice, bySupplierAmount };
  }, [tramites]);

  const totalGroups = byInvoice.length + bySupplierAmount.length;

  if (totalGroups === 0) {
    return (
      <div className="card card-padded" style={{ textAlign: "center", color: "var(--gray)" }}>
        No se encontraron posibles duplicados. ({tramites.length} trámites revisados)
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {byInvoice.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Mismo número de factura ({byInvoice.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byInvoice.map(([invoice, rows]) => (
              <Group key={invoice} title={`Factura ${invoice}`} rows={rows} />
            ))}
          </div>
        </section>
      )}

      {bySupplierAmount.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Mismo proveedor y monto, distinto número de factura ({bySupplierAmount.length})
          </h2>
          <p style={{ fontSize: 12, color: "var(--gray)", marginBottom: 10 }}>
            Revisar con cuidado: puede ser coincidencia (compras iguales en fechas distintas)
            o el mismo trámite registrado dos veces con el número mal digitado.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bySupplierAmount.map(([key, rows]) => (
              <Group key={key} title={`${rows[0].supplier} · ₡${fmt(Number(rows[0].amount))}`} rows={rows} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="card card-padded">
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{title}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "var(--gray)", fontSize: 11, textTransform: "uppercase" }}>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Proyecto</th>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Factura</th>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Estado</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Monto</th>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Aprobado</th>
            <th style={{ padding: "4px 8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "6px 8px" }}>{projectName(r.project)}</td>
              <td style={{ padding: "6px 8px" }}>{r.invoice_number}</td>
              <td style={{ padding: "6px 8px" }}>{r.status}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>₡{fmt(Number(r.amount))}</td>
              <td style={{ padding: "6px 8px" }}>{r.approval_date ?? "—"}</td>
              <td style={{ padding: "6px 8px" }}>
                <Link href={`/tramites/${r.id}`} className="btn btn-ghost btn-sm">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
