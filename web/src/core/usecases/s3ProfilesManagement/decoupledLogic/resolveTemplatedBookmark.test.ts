import { describe, expect, it } from "vitest";
import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { resolveTemplatedBookmark } from "./resolveTemplatedBookmark";

const bookmark_fromConfig: S3Config.Entry.Bookmark.Templated = {
    isTemplated: true,
    claimName: "groups",
    includedClaimPattern: "^([\\s\\S]*)$",
    excludedClaimPattern: undefined,
    s3UriStr: "s3://project-$1/",
    title: { en: "Group $1", fr: "Groupe $1" },
    forProfileNames: ["profile-$1"]
};

function resolve(params: {
    values: string[];
    config?: Partial<S3Config.Entry.Bookmark.Templated>;
}) {
    return resolveTemplatedBookmark({
        bookmark_fromConfig: { ...bookmark_fromConfig, ...params.config },
        decodedIdToken: { groups: params.values }
    });
}

describe("resolveTemplatedBookmark", () => {
    it("skips invalid destinations while preserving valid bookmarks and their metadata", () => {
        expect(
            resolve({ values: ["team-one", "team_two", "TeamThree", "team-four"] })
        ).toStrictEqual(
            ["team-one", "team-four"].map(group => ({
                s3Uri: {
                    bucket: `project-${group}`,
                    delimiter: "/",
                    keySegments: [],
                    isDelimiterTerminated: true
                },
                title: { en: `Group ${group}`, fr: `Groupe ${group}` },
                forProfileNames: [`profile-${group}`]
            }))
        );
    });

    it.each([
        "ab",
        "a".repeat(64),
        "bad_bucket",
        "Bad-bucket",
        "bad bucket",
        "-bucket",
        "bucket-",
        ".bucket",
        "bucket.",
        "bad..bucket",
        "bad.-bucket",
        "bad-.bucket",
        "192.168.1.1",
        "bucket\n",
        "bucket?query",
        "bucket#fragment"
    ])("filters invalid bucket name %j", bucket => {
        expect(resolve({ values: [bucket], config: { s3UriStr: "s3://$1/" } })).toEqual(
            []
        );
    });

    it.each(["abc", "a".repeat(63), "my.bucket-123", "123", "my--bucket"])(
        "accepts valid bucket name %j",
        bucket => {
            const bookmarks = resolve({
                values: [bucket],
                config: { s3UriStr: "s3://$1" }
            });

            expect(bookmarks.map(({ s3Uri }) => stringifyS3Uri(s3Uri))).toEqual([
                `s3://${bucket}/`
            ]);
        }
    );

    it.each(["Team_one", "équipe été", "资料/🚀", "a!b*c'd(e)_f", "a?b#c%20"])(
        "preserves valid object key characters in %j",
        group => {
            const bookmarks = resolve({
                values: [group],
                config: { s3UriStr: "s3://shared/$1/" }
            });

            expect(bookmarks.map(({ s3Uri }) => stringifyS3Uri(s3Uri))).toEqual([
                `s3://shared/${group}/`
            ]);
        }
    );

    it("checks the UTF-8 byte length of the full key, including its trailing slash", () => {
        const validKeys = ["a".repeat(1023), `${"é".repeat(511)}a`, "🚀".repeat(255)];

        const bookmarks = resolve({
            values: [...validKeys, "a".repeat(1024), "é".repeat(512), "🚀".repeat(256)],
            config: { s3UriStr: "s3://shared/$1/" }
        });

        expect(bookmarks.map(({ s3Uri }) => stringifyS3Uri(s3Uri))).toEqual(
            validKeys.map(key => `s3://shared/${key}/`)
        );
    });

    it("accepts a non-terminated key of exactly 1,024 bytes", () => {
        expect(
            resolve({
                values: ["a".repeat(1024)],
                config: { s3UriStr: "s3://shared/$1" }
            })
        ).toHaveLength(1);
    });

    it.each([".", "..", "a/../b", "a/./b", "\uD800", "\uDC00"])(
        "skips object keys that cannot be used reliably: %j",
        key => {
            expect(
                resolve({ values: [key], config: { s3UriStr: "s3://shared/$1/" } })
            ).toEqual([]);
        }
    );

    it("skips malformed resolved URIs without aborting resolution", () => {
        const bookmarks = resolve({
            values: ["not-an-s3-uri", "s3://", "s3:///path", "s3://valid/path/"],
            config: { s3UriStr: "$1" }
        });

        expect(bookmarks.map(({ s3Uri }) => stringifyS3Uri(s3Uri))).toEqual([
            "s3://valid/path/"
        ]);
    });

    it.each(["path\n", "path\r", "path\u2028", "path\u2029"])(
        "skips a URI if parsing would silently truncate its key: %j",
        key => {
            expect(
                resolve({ values: [key], config: { s3UriStr: "s3://shared/$1" } })
            ).toEqual([]);
        }
    );

    it("validates after capture substitution and keeps claim inclusion/exclusion filters", () => {
        const bookmarks = resolve({
            values: ["group_valid", "group_secret", "other", "group_bad_name"],
            config: {
                s3UriStr: "s3://$1/",
                includedClaimPattern: "^group_(.*)$",
                excludedClaimPattern: "^group_secret$"
            }
        });

        expect(bookmarks.map(({ s3Uri }) => stringifyS3Uri(s3Uri))).toEqual([
            "s3://valid/"
        ]);
    });
});
