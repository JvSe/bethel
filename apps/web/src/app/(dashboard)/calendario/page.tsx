import CalendarioView from "@/views/calendario";
import { getWeekEvents } from "@/server/data/calendario";
import { requireFamilySession } from "@/server/auth";

interface CalendarioPageProps {
  searchParams: Promise<{ semana?: string }>;
}

export default async function CalendarioPage({ searchParams }: CalendarioPageProps) {
  const { familyId } = await requireFamilySession();
  const { semana } = await searchParams;
  const weekOffset = Number.isInteger(Number(semana)) ? Number(semana) : 0;

  const { weekStart, events } = await getWeekEvents(familyId, weekOffset);

  return <CalendarioView weekStart={weekStart} events={events} weekOffset={weekOffset} />;
}
