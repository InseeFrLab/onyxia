import { describe, expect, it } from "vitest";
import { getPresignedPostKeyPrefix } from "./getPresignedPostKeyPrefix";

function encodePolicy(policy: unknown): string {
    return btoa(
        Array.from(new TextEncoder().encode(JSON.stringify(policy)), byte =>
            String.fromCharCode(byte)
        ).join("")
    );
}

describe("getPresignedPostKeyPrefix", () => {
    it("extracts the key prefix from an S3 POST policy", () => {
        expect(
            getPresignedPostKeyPrefix({
                presignedPost_fields: {
                    Policy: encodePolicy({
                        expiration: "2026-09-03T00:00:00Z",
                        conditions: [
                            { bucket: "garronej" },
                            ["starts-with", "$key", "requested-files/été/"]
                        ]
                    })
                }
            })
        ).toBe("requested-files/été/");
    });

    const fieldsWithoutValidKeyPrefix: Record<string, string>[] = [
        {},
        { Policy: "not-base64" },
        { Policy: encodePolicy({ conditions: {} }) },
        {
            Policy: encodePolicy({
                conditions: [["content-length-range", 0, 1_000]]
            })
        }
    ];

    it.each(fieldsWithoutValidKeyPrefix)(
        "returns undefined when no valid key-prefix condition exists",
        fields => {
            expect(
                getPresignedPostKeyPrefix({
                    presignedPost_fields: fields
                })
            ).toBeUndefined();
        }
    );
});
