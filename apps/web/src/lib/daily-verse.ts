export const DAILY_VERSE_VERSION = "nvi";
export const DAILY_VERSE_VERSION_LABEL = "NVI";

export interface DailyVerse {
  reference: string;
  text: string;
  version: string;
  versionLabel: string;
}

/** Used when the verse-of-the-day API is unreachable. */
export const FALLBACK_DAILY_VERSE: DailyVerse = {
  reference: "João 14:27",
  text: "Deixo a paz a vocês; a minha paz dou a vocês. Não a dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.",
  version: DAILY_VERSE_VERSION,
  versionLabel: DAILY_VERSE_VERSION_LABEL,
};

export function versionLabel(slug: string) {
  return slug.trim().toUpperCase() || DAILY_VERSE_VERSION_LABEL;
}

export function parseDailyVerse(payload: unknown): DailyVerse | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const reference = typeof data.reference === "string" ? data.reference.trim() : "";
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!reference || !text) return null;

  const version =
    typeof data.version === "string" && data.version.trim()
      ? data.version.trim().toLowerCase()
      : DAILY_VERSE_VERSION;

  return {
    reference,
    text,
    version,
    versionLabel: versionLabel(version),
  };
}
