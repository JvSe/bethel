import { FALLBACK_DAILY_VERSE, parseDailyVerse, type DailyVerse } from "@/lib/daily-verse";

export type { DailyVerse };

const MIDVASH_VOTD_URL = "https://api.midvash.com/v1/votd?language=pt-br&version=nvi";

export async function getDailyVerse(): Promise<DailyVerse> {
  try {
    const response = await fetch(MIDVASH_VOTD_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return FALLBACK_DAILY_VERSE;

    const payload: unknown = await response.json();
    return parseDailyVerse(payload) ?? FALLBACK_DAILY_VERSE;
  } catch {
    return FALLBACK_DAILY_VERSE;
  }
}
