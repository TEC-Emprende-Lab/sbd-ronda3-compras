import { createServerSupabaseClient } from "@/lib/supabase-server";
import TramiteForm from "@/components/TramiteForm";

export const dynamic = "force-dynamic";

export default async function NuevoTramitePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, category")
    .order("category")
    .order("name");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo trámite</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registra una orden de compra, factura o reintegro
        </p>
      </div>
      <TramiteForm
        projects={projects || []}
        defaultProjectId={project ? parseInt(project) : undefined}
      />
    </div>
  );
}
