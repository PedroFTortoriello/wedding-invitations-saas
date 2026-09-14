import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Presentes em dinheiro"
      subtitle="Os presentes via Pix caem 100% na sua chave, sem intermediação — confirme aqui o que já recebeu. Os de cartão se confirmam sozinhos."
      active="cash-gifts"
    />
  );
}
