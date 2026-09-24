import GratidaoView from "@/views/gratidao";
import { getGratitudeEntries } from "@/server/data/gratidao";
import { requireFamilySession } from "@/server/auth";

export default async function GratidaoPage() {
  const { familyId, userId, isOwner } = await requireFamilySession();
  const entries = await getGratitudeEntries(familyId);

  return <GratidaoView entries={entries} currentUserId={userId} isOwner={isOwner} />;
}
