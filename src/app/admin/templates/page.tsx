import { AdminShell } from "@/components/app/AdminShell";
import { platformTemplates } from "@/lib/platform-data";

export default function AdminTemplatesPage() {
  return (
    <AdminShell title="Modelos" subtitle="Biblioteca de experiências visuais disponíveis para casais." active="templates">
      <div className="grid gap-5 md:grid-cols-2">
        {platformTemplates.map((template) => (
          <article key={template.id} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/8">
            <img src={template.previewImage} alt="" className="h-80 w-full object-cover" />
            <div className="p-6">
              <h2 className="t-h1">{template.name}</h2>
              <p className="mt-3 text-sm leading-6 text-on-forest">{template.description}</p>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
