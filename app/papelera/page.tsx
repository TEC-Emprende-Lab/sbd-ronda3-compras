import { createServerSupabaseClient } from "@/lib/supabase-server";
import PapeleraClient from "@/components/PapeleraClient";

export const dynamic = "force-dynamic";

export default async function PapeleraPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tramites } = await supabase
    .from("tramites")
    .select("*, project:projects(id, name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>Papelera</h1>
        <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
          Trámites eliminados — puedes restaurarlos o borrarlos definitivamente
        </p>
      </div>

      <PapeleraClient tramites={tramites || []} />
    </div>
  );
}
