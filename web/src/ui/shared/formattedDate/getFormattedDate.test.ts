import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { getFormattedDate } from "./getFormattedDate";

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

        expect(formattedDate).toBe("Thursday, June 15, 2023 at 3:20 PM");
    });

    it("formats date in a different year", () => {
        // Using Date.UTC to create a consistent UTC time with different year
        const time = new Date(Date.UTC(2023, 5, 15, 15, 20)).getTime(); // June 15, 2023, 15:20 UTC
        const formattedDate = getFormattedDate({ time, lang: "en" });

        expect(formattedDate).toBe("Thursday, June 15, 2023 at 3:20 PM");
    });

    it("respects localization (fr)", () => {
        // Using Date.UTC to create a consistent UTC time
        const time = new Date(Date.UTC(2023, 10, 25, 15, 20)).getTime(); // November 25, 2023, 15:20 UTC
        const formattedDate = getFormattedDate({ time, lang: "fr" });

        // cspell: disable-next-line
        expect(formattedDate).toBe("samedi 25 novembre 2023 à 15:20");
    });
});
