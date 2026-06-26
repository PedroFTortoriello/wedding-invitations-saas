import { AdminShell } from "@/components/app/AdminShell";
import { MetricCard } from "@/components/app/MetricCard";
import { formatCurrency, platformMetrics, PUBLISH_FEE_BRL } from "@/lib/platform-data";

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="Operacao da plataforma"
      subtitle="Visão geral para acompanhar usuários, sites publicados, presentes Pix e receita por publicação."
      active="dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 [&_article]:bg-[#fffaf1] [&_article]:text-[#332820]">
        <MetricCard label="Usuarios" value={String(platformMetrics.totalUsers)} helper="Contas cadastradas na plataforma." />
        <MetricCard label="Casamentos" value={String(platformMetrics.totalWeddings)} helper="Sites criados no sistema." />
        <MetricCard label="Publicados" value={String(platformMetrics.publishedWeddings)} helper="Sites visíveis para convidados." />
        <MetricCard label="Receita" value={formatCurrency(platformMetrics.revenue)} helper={`Taxa de publicação (${formatCurrency(PUBLISH_FEE_BRL)}) por site publicado.`} />
      </div>
    </AdminShell>
  );
}
