import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Convidados e RSVP"
      subtitle="Monte a lista de convidados. No site, cada pessoa confirma presença digitando o nome — só quem está na lista consegue confirmar."
      active="guests"
    />
  );
}
