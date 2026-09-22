import { createServerSupabaseClient } from "@/lib/supabase-server";
import FundatecReconcile from "@/components/FundatecReconcile";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FundatecPage() {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase.from("projects").select("*").order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--black)" }}>
            Conciliación con FUNDATEC
          </h1>
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
            Sube el reporte "Situación Presupuestaria" (rpSituacion.xls) de un proyecto y
            compáralo al instante contra lo registrado en la plataforma.
          </p>
        </div>
        <Link href="/reporte" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
          ← Reporte de sesión
        </Link>
      </div>

      <FundatecReconcile projects={projects ?? []} />
    </div>
  );
}
