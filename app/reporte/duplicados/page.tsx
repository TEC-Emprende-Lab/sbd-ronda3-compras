import { createServerSupabaseClient } from "@/lib/supabase-server";
import DuplicadosClient from "@/components/DuplicadosClient";

export const dynamic = "force-dynamic";

export default async function DuplicadosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: tramites } = await supabase
    .from("tramites")
    .select("id, project_id, invoice_number, supplier, amount, approval_date, status, project:projects(id, name)")
    .is("deleted_at", null)
    .order("supplier");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>
          Posibles trámites duplicados
        </h1>
        <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
          Compara todos los trámites por número de factura exacto y también por
          proveedor + monto (para detectar casos donde el número se digitó distinto
          pero es la misma compra).
        </p>
      </div>

      <DuplicadosClient tramites={tramites ?? []} />
    </div>
  );
}
