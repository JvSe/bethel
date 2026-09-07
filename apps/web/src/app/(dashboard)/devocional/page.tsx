import DevocionalView from "@/views/devocional";
import { getDailyVerse } from "@/server/data/devocional";
import { requireFamilySession } from "@/server/auth";

export default async function DevocionalPage() {
  await requireFamilySession();
  const verse = await getDailyVerse();

  return <DevocionalView verse={verse} />;
}
