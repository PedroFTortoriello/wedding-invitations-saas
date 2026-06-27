import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { EditorForm, type EditorValues } from "./EditorForm";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const values: EditorValues = {
    coupleNames: site.coupleNames,
    welcomeText: site.welcomeText,
    weddingDateLabel: site.weddingDateLabel,
    weddingTime: site.weddingTime,
    primaryColor: site.theme.primaryDark,
    templateId: site.templateId,
    pixKey: site.pixKey,
    pixKeyType: site.pixKeyType,
    pixHolderName: site.pixHolderName
  };

  return (
    <AppShell
      title="Editor do site"
      subtitle="Edite os dados do seu site e salve. As alterações aparecem na prévia pública."
      active="editor"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <EditorForm values={values} />

        <aside className="card flex h-fit flex-col p-6">
          <p className="t-eyebrow text-ink-soft">Resumo do site</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Status</dt>
              <dd>
                <StatusBadge status={site.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Link</dt>
              <dd className="truncate font-bold text-ink">/casamento/{site.slug}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Modelo</dt>
              <dd className="font-bold text-ink">{site.templateName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Galeria</dt>
              <dd className="font-bold text-ink">{site.gallery.length} fotos</dd>
            </div>
          </dl>
          <Link href={`/casamento/${site.slug}`} className="btn btn-primary mt-6 w-full text-sm">
            Prévia pública
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
