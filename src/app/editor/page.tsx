import { redirect } from "next/navigation";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { LiveEditor } from "./LiveEditor";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  return <LiveEditor initial={rowToWeddingSite(row)} />;
}
