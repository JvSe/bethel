import prisma from "@bethel/db";
import type { CreateCalendarEventInput } from "@/server/validators/calendario";

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getWeekEvents(familyId: string, weekOffset = 0) {
  const weekStart = startOfWeek();
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const events = await prisma.calendarEvent.findMany({
    where: { familyId, startsAt: { gte: weekStart, lt: weekEnd } },
    orderBy: { startsAt: "asc" },
  });

  return { weekStart, events };
}

export async function createCalendarEvent(familyId: string, input: CreateCalendarEventInput) {
  await prisma.calendarEvent.create({
    data: {
      familyId,
      title: input.title,
      category: input.category,
      startsAt: new Date(`${input.date}T${input.startTime}`),
      endsAt: input.endTime ? new Date(`${input.date}T${input.endTime}`) : null,
    },
  });
}

export async function updateCalendarEvent(familyId: string, eventId: string, input: CreateCalendarEventInput) {
  const result = await prisma.calendarEvent.updateMany({
    where: { id: eventId, familyId },
    data: {
      title: input.title,
      category: input.category,
      startsAt: new Date(`${input.date}T${input.startTime}`),
      endsAt: input.endTime ? new Date(`${input.date}T${input.endTime}`) : null,
    },
  });

  if (result.count === 0) throw new Error("Evento não encontrado.");
}

export async function deleteCalendarEvent(familyId: string, eventId: string) {
  const result = await prisma.calendarEvent.deleteMany({
    where: { id: eventId, familyId },
  });
  if (result.count === 0) throw new Error("Evento não encontrado.");
}
