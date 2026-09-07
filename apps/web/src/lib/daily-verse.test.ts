import { describe, expect, it } from "vitest";
import { FALLBACK_DAILY_VERSE, parseDailyVerse, versionLabel } from "./daily-verse";

describe("parseDailyVerse", () => {
  it("reads Midvash verse-of-the-day payloads", () => {
    expect(
      parseDailyVerse({
        reference: "João 14:27",
        text: "Deixo a paz a vocês; a minha paz dou a vocês.",
        version: "nvi",
        book_slug: "joao",
        chapter: 14,
        verse_start: 27,
        verse_end: 27,
      }),
    ).toEqual({
      reference: "João 14:27",
      text: "Deixo a paz a vocês; a minha paz dou a vocês.",
      version: "nvi",
      versionLabel: "NVI",
    });
  });

  it("rejects payloads without reference or text", () => {
    expect(parseDailyVerse({ reference: "João 3:16" })).toBeNull();
    expect(parseDailyVerse({ text: "Porque Deus amou o mundo." })).toBeNull();
    expect(parseDailyVerse(null)).toBeNull();
  });

  it("falls back to NVI when version is missing", () => {
    expect(
      parseDailyVerse({
        reference: "Salmos 23:1",
        text: "O Senhor é o meu pastor; de nada terei falta.",
      }),
    ).toMatchObject({ version: "nvi", versionLabel: "NVI" });
  });
});

describe("versionLabel", () => {
  it("uppercases the version slug", () => {
    expect(versionLabel("nvi")).toBe("NVI");
    expect(versionLabel("")).toBe(FALLBACK_DAILY_VERSE.versionLabel);
  });
});
