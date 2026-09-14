import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Painel do casal"
      subtitle="Acompanhe publicação, convidados, presentes e personalização do site em um painel único."
      active="dashboard"
    />
  );
}
