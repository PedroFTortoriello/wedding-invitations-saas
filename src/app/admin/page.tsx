import { AdminShell } from "@/components/app/AdminShell";
import { MetricCard } from "@/components/app/MetricCard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, PUBLISH_FEE_BRL } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [users, weddings, published, payments] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("weddings").select("id", { count: "exact", head: true }),
    supabase.from("weddings").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("publish_payments").select("amount_cents").eq("status", "paid")
  ]);

  const revenue = (payments.data ?? []).reduce((total, payment) => total + payment.amount_cents, 0) / 100;

  return (
    <AdminShell
      title="Operação da plataforma"
      subtitle="Visão geral para acompanhar usuários, sites publicados e receita por publicação."
      active="dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 [&_article]:bg-[#fffaf1] [&_article]:text-ink">
        <MetricCard label="Usuários" value={String(users.count ?? 0)} helper="Contas cadastradas na plataforma." />
        <MetricCard label="Casamentos" value={String(weddings.count ?? 0)} helper="Sites criados no sistema." />
        <MetricCard label="Publicados" value={String(published.count ?? 0)} helper="Sites visíveis para convidados." />
        <MetricCard
          label="Receita"
          value={formatCurrency(revenue)}
          helper={`Taxa de publicação (${formatCurrency(PUBLISH_FEE_BRL)}) confirmada.`}
        />
      </div>
    </AdminShell>
  );
}
