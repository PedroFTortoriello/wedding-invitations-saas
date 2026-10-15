import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return <PageSkeleton title="Recebimentos" subtitle="Presentes em dinheiro enviados pelos convidados. Confirme aqui os Pix que já caíram na sua conta." active="cash-gifts" />;
}
