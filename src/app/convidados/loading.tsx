import { PageSkeleton } from "@/components/app/PageSkeleton";

export default function Loading() {
  return <PageSkeleton title="Convidados" subtitle="Quem está na lista confirma presença no site digitando o próprio nome." active="guests" />;
}
