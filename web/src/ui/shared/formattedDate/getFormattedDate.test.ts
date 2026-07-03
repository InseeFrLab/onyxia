import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { getFormattedDate, getFormattedRelativeDate } from "./getFormattedDate";

describe("getFormattedDate", () => {
    // Mock `Intl.DateTimeFormat` to always use UTC
    beforeAll(() => {
        const originalDateTimeFormat = Intl.DateTimeFormat;

        vi.spyOn(Intl, "DateTimeFormat").mockImplementation((locale, options) => {
            return new originalDateTimeFormat(locale, {
                ...options,
                timeZone: "UTC" // Force UTC timezone
            });
        });
    });

    afterAll(() => {
        vi.restoreAllMocks(); // Restore original implementation
    });

    it("formats date within the same year", () => {
        // Using Date.UTC to create a consistent UTC time
        const time = new Date(Date.UTC(2023, 5, 15, 15, 20)).getTime(); // June 15, 2023, 15:20 UTC
        const formattedDate = getFormattedDate({ time, lang: "en" });

        expect(formattedDate).toBe("June 15, 2023 at 3:20 PM");
    });

    it("formats date in a different year", () => {
        // Using Date.UTC to create a consistent UTC time with different year
        const time = new Date(Date.UTC(2023, 5, 15, 15, 20)).getTime(); // June 15, 2023, 15:20 UTC
        const formattedDate = getFormattedDate({ time, lang: "en" });

        expect(formattedDate).toBe("June 15, 2023 at 3:20 PM");
    });

    it("respects localization (fr)", () => {
        // Using Date.UTC to create a consistent UTC time
        const time = new Date(Date.UTC(2023, 10, 25, 15, 20)).getTime(); // November 25, 2023, 15:20 UTC
        const formattedDate = getFormattedDate({ time, lang: "fr" });

        // cspell: disable-next-line
        expect(formattedDate).toBe("25 novembre 2023 à 15:20");
    });

    it("formats today's date relative to now", () => {
        const now = new Date(Date.UTC(2026, 6, 3, 12, 0)).getTime();
        const time = new Date(Date.UTC(2026, 6, 3, 10, 25)).getTime();

        const formattedDate = getFormattedRelativeDate({ time, lang: "en", now });

        expect(formattedDate).toBe("Today at 10:25\u202fAM");
    });

    it("formats yesterday's date relative to now", () => {
        const now = new Date(Date.UTC(2026, 6, 3, 12, 0)).getTime();
        const time = new Date(Date.UTC(2026, 6, 2, 12, 0)).getTime();

        const formattedDate = getFormattedRelativeDate({ time, lang: "fr", now });

        expect(formattedDate).toBe("Hier à 12:00");
    });
});
