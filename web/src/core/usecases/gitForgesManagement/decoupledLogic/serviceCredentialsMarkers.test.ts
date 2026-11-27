import { describe, expect, it } from "vitest";
import {
    collectServiceCredentialsMarkers,
    createServiceCredentialsMarker,
    keepTrustedServiceCredentialsMarkers
} from "./serviceCredentialsMarkers";

const marker = createServiceCredentialsMarker({
    kind: "access-token",
    forgeId: "gitlab"
});

describe(keepTrustedServiceCredentialsMarkers.name, () => {
    it("keeps the markers where Onyxia put them, in objects and arrays", () => {
        const trustedValue = {
            git: { token: marker, forges: [{ credentials: { token: marker } }] }
        };

        expect(
            keepTrustedServiceCredentialsMarkers({ value: trustedValue, trustedValue })
        ).toStrictEqual(trustedValue);
    });

    it("empties a marker a shared link put elsewhere", () => {
        const helmValues = keepTrustedServiceCredentialsMarkers({
            value: {
                git: { token: marker },
                environment: { variables: [{ name: "LEAK", value: marker }] }
            },
            trustedValue: {
                git: { token: marker },
                environment: { variables: [] }
            }
        });

        expect(helmValues).toStrictEqual({
            git: { token: marker },
            environment: { variables: [{ name: "LEAK", value: "" }] }
        });
        expect(collectServiceCredentialsMarkers(helmValues)).toStrictEqual([marker]);
    });

    it("empties a marker put where Onyxia put none", () => {
        expect(
            keepTrustedServiceCredentialsMarkers({
                value: { git: { token: marker } },
                trustedValue: { git: { token: "" } }
            })
        ).toStrictEqual({ git: { token: "" } });
    });

    it("empties the marker of a forge whose url a shared link changed", () => {
        const forge = {
            url: "https://gitlab.example.com",
            credentials: { type: "token", token: marker }
        };

        expect(
            keepTrustedServiceCredentialsMarkers({
                value: {
                    git: {
                        forges: [{ ...forge, url: "https://attacker.example" }]
                    }
                },
                trustedValue: { git: { forges: [forge] } }
            })
        ).toStrictEqual({
            git: {
                forges: [
                    {
                        url: "https://attacker.example",
                        credentials: { type: "token", token: "" }
                    }
                ]
            }
        });
    });
});
