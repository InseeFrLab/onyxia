import { describe, expect, it } from "vitest";
import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { resolveTemplatedStsRole } from "./resolveTemplatedStsRole";

const stsRole_fromConfig: S3Config.Entry.StsRole.Templated = {
    isTemplated: true,
    claimName: "groups",
    includedClaimPattern: "^([\\s\\S]*)$",
    excludedClaimPattern: undefined,
    roleARN: "arn:aws:iam::123456789012:role/$1",
    roleSessionName: "$1",
    profileName: "Profile $1"
};

function resolve(params: {
    values: string[];
    config?: Partial<S3Config.Entry.StsRole.Templated>;
}) {
    return resolveTemplatedStsRole({
        stsRole_fromConfig: { ...stsRole_fromConfig, ...params.config },
        decodedIdToken: { groups: params.values }
    });
}

describe("resolveTemplatedStsRole", () => {
    it("skips invalid roles without dropping valid roles", () => {
        expect(resolve({ values: ["Team_one", "bad group", "Team_two"] })).toEqual(
            ["Team_one", "Team_two"].map(group => ({
                roleARN: `arn:aws:iam::123456789012:role/${group}`,
                roleSessionName: group,
                profileName: `Profile ${group}`
            }))
        );
    });

    it.each(["ab", "a".repeat(64), "User_name+=,.@-123"])(
        "accepts valid session name %j",
        roleSessionName => {
            expect(resolve({ values: [roleSessionName] })).toHaveLength(1);
        }
    );

    it.each(["", "a", "a".repeat(65), "a b", "a/b", "a:b", "a#b", "ab\n", "été"])(
        "filters invalid session name %j",
        roleSessionName => {
            expect(
                resolve({
                    values: [roleSessionName],
                    config: { roleARN: "arn:aws:iam::123456789012:role/onyxia" }
                })
            ).toEqual([]);
        }
    );

    it.each([
        "arn:aws:iam::123456789012:role/onyxia",
        "arn:aws-cn:iam::123456789012:role/path/onyxia",
        "arn:aws-us-gov:iam::123456789012:role/path/Team_one",
        "arn:minio:iam:::role/Team_one",
        "arn:minio:iam:us-east-1::role/Team_one"
    ])("accepts AWS and MinIO role ARN %j", roleARN => {
        expect(
            resolve({
                values: [roleARN],
                config: { roleARN: "$1", roleSessionName: "onyxia" }
            })
        ).toEqual([
            { roleARN, roleSessionName: "onyxia", profileName: `Profile ${roleARN}` }
        ]);
    });

    it.each([
        "",
        "not-an-arn",
        "arn:aws:iam::123456789012:role/",
        "arn:aws:iam::123456789012:user/onyxia",
        "arn:aws:iam::123456789012:role/bad group",
        "arn:aws:iam::123456789012:role/bad#group",
        "arn:aws:iam::123456789012:role/onyxia\n",
        `arn:aws:iam::123456789012:role/${"a".repeat(2048)}`
    ])("filters malformed resolved role ARN %j", roleARN => {
        expect(
            resolve({
                values: [roleARN],
                config: { roleARN: "$1", roleSessionName: "onyxia" }
            })
        ).toEqual([]);
    });

    it("preserves explicitly empty MinIO STS fields and unrestricted profile display names", () => {
        expect(
            resolve({
                values: ["Équipe / Team_one"],
                config: { roleARN: "", roleSessionName: "" }
            })
        ).toEqual([
            { roleARN: "", roleSessionName: "", profileName: "Profile Équipe / Team_one" }
        ]);
    });
});
