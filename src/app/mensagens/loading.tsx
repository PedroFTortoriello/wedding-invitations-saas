import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Mensagens"
      subtitle="Recados enviados pelos convidados a partir do site."
      active="messages"
    />
  );
}
