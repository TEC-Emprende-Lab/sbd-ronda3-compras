import { createServerSupabaseClient } from "@/lib/supabase-server";
import TramiteForm from "@/components/TramiteForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function EditTramitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: tramite } = await supabase
    .from("tramites")
    .select("*, project:projects(id, name, category)")
    .eq("id", id)
    .single();

  if (!tramite) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, category")
    .order("category")
    .order("name");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href={`/projects/${tramite.project_id}`}
            className="text-sm text-brand-600 hover:underline"
          >
            ← {tramite.project?.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Editar trámite</h1>
        </div>
        <DeleteButton tramiteId={tramite.id} projectId={tramite.project_id} />
      </div>
      <TramiteForm
        projects={projects || []}
        defaultProjectId={tramite.project_id}
        tramite={tramite}
      />
    </div>
  );
}
