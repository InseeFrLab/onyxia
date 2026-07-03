import { describe, expect, it } from "vitest";
import { queryStringSerializer } from "./route";

describe("launcher queryStringSerializer", () => {
    it("uses URL-encoded backslashes when stringifying dots inside Helm path parts", () => {
        const got = queryStringSerializer.stringify({
            helmValuesPatch: {
                array: false,
                value: JSON.stringify([
                    {
                        path: ["spark", "userConfig", "spark.driver.memory"],
                        value: "5g"
                    }
                ])
            }
        });

        expect(got).toBe("spark.userConfig.spark%5C.driver%5C.memory=«5g»");
        expect(got).not.toContain("\\.");
    });

    it("parses URL-encoded escaped dots in Helm path parts", () => {
        const got = queryStringSerializer.parse(
            "spark.userConfig.spark%5C.driver%5C.memory=%C2%AB5g%C2%BB"
        );
        const got_lowercasePercentEncoding = queryStringSerializer.parse(
            "spark.userConfig.spark%5c.driver%5c.memory=%C2%AB5g%C2%BB"
        );

        const expected = [
            {
                path: ["spark", "userConfig", "spark.driver.memory"],
                value: "5g"
            }
        ];

        expect(JSON.parse(got.helmValuesPatch as string)).toStrictEqual(expected);
        expect(
            JSON.parse(got_lowercasePercentEncoding.helmValuesPatch as string)
        ).toStrictEqual(expected);
    });

    it("keeps parsing legacy raw escaped dots in Helm path parts", () => {
        const got = queryStringSerializer.parse(
            String.raw`spark.userConfig.spark\.driver\.memory=%C2%AB5g%C2%BB`
        );

        expect(JSON.parse(got.helmValuesPatch as string)).toStrictEqual([
            {
                path: ["spark", "userConfig", "spark.driver.memory"],
                value: "5g"
            }
        ]);
    });
});
