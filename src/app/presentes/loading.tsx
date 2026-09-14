import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Presentes em dinheiro"
      subtitle="Crie as cotas do seu site. No Pix, 100% vai para o casal, sem taxa da plataforma — e dá para aceitar cartão também."
      active="gifts"
    />
  );
}
