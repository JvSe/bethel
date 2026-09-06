import prisma from "@bethel/db";

interface DevotionalDay {
  day: number;
  reference: string;
}

function parseContent(content: unknown): DevotionalDay[] {
  if (!Array.isArray(content)) return [];
  return content.filter(
    (item): item is DevotionalDay =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as DevotionalDay).day === "number" &&
      typeof (item as DevotionalDay).reference === "string",
  );
}

export async function getDevotionalOverview(familyId: string, userId: string) {
  const familyDevotional = await prisma.familyDevotional.findUnique({
    where: { familyId },
    include: { plan: true },
  });

  if (!familyDevotional) return null;

  const content = parseContent(familyDevotional.plan.content).sort((a, b) => a.day - b.day);
  const total = content.length;
  if (total === 0) return null;

  const daysSinceStart = Math.floor((Date.now() - familyDevotional.startedAt.getTime()) / 86_400_000);
  const currentDay = Math.min(Math.max(daysSinceStart + 1, 1), total);

  const completions = await prisma.devotionalCompletion.findMany({
    where: { familyDevotionalId: familyDevotional.id, userId },
    select: { day: true },
  });
  const completedDays = new Set(completions.map((c) => c.day));

  const windowStart = Math.max(1, currentDay - 2);
  const windowEnd = Math.min(total, currentDay + 2);
  const days = content
    .filter((d) => d.day >= windowStart && d.day <= windowEnd)
    .map((d) => ({
      day: d.day,
      reference: d.reference,
      done: completedDays.has(d.day),
      isToday: d.day === currentDay,
    }));

  const today = content.find((d) => d.day === currentDay) ?? null;

  return {
    planTitle: familyDevotional.plan.title,
    currentDay,
    total,
    progressPct: Math.round((currentDay / total) * 100),
    todayReference: today?.reference ?? null,
    days,
  };
}

export async function toggleDevotionalDay(familyId: string, userId: string, day: number) {
  const familyDevotional = await prisma.familyDevotional.findUnique({ where: { familyId } });
  if (!familyDevotional) throw new Error("Plano devocional não encontrado.");

  const existing = await prisma.devotionalCompletion.findUnique({
    where: {
      familyDevotionalId_userId_day: {
        familyDevotionalId: familyDevotional.id,
        userId,
        day,
      },
    },
  });

  if (existing) {
    await prisma.devotionalCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.devotionalCompletion.create({
      data: { familyDevotionalId: familyDevotional.id, userId, day },
    });
  }
}
