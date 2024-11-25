import { describe, it, expect } from "vitest";
import { getFormattedDate } from "./getFormattedDate";

describe("getFormattedDate", () => {
    it("formats date within the same year", () => {
        const time = new Date(1732544444722).setMonth(5, 15);
        const formattedDate = getFormattedDate({ time, lang: "en" });

        expect(formattedDate).toBe("Saturday, June 15 at 3:20 PM");
    });

    it("formats date in a different year", () => {
        const time = new Date(1732544444722).setFullYear(2023);
        const formattedDate = getFormattedDate({ time, lang: "en" });

        expect(formattedDate).toBe("Saturday, November 25, 2023 at 3:20 PM");
    });

    it("respects localization (fr)", () => {
        const time = 1732544444722;

        const formattedDate = getFormattedDate({ time, lang: "fr" });

        // cspell: disable-next-line
        expect(formattedDate).toBe("lundi 25 novembre à 15:20");
    });
});
