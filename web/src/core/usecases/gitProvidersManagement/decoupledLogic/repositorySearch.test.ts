import { describe, expect, it } from "vitest";
import type { GitRepository } from "core/ports/GitProvider";
import {
    getIsRepositorySearchNeeded,
    getRepositorySearchMatches,
    updateRepositorySearchCache
} from "./repositorySearch";

const createRepository = (fullPath: string, name?: string): GitRepository => ({
    id: fullPath,
    name: name ?? fullPath.split("/")[1],
    fullPath,
    description: undefined,
    webUrl: `https://git.example.com/${fullPath}`,
    httpCloneUrl: `https://git.example.com/${fullPath}.git`,
    defaultBranch: "main"
});

const getFullPaths = (repositories: GitRepository[]) =>
    repositories.map(({ fullPath }) => fullPath);

describe("repositorySearch", () => {
    it("asks the provider until the search was answered", () => {
        expect(getIsRepositorySearchNeeded({ cache: undefined, search: "" })).toBe(true);

        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "",
            repositories: [createRepository("jdoe/alpha")],
            hasNextPage: true
        });

        expect(getIsRepositorySearchNeeded({ cache, search: "  " })).toBe(false);
        expect(getIsRepositorySearchNeeded({ cache, search: "alp" })).toBe(true);

        const cache_searched = updateRepositorySearchCache({
            cache,
            search: "alp",
            repositories: [createRepository("jdoe/alpha")],
            hasNextPage: false
        });

        expect(
            getIsRepositorySearchNeeded({ cache: cache_searched, search: " ALP " })
        ).toBe(false);
    });

    it("no longer asks once every repository is known", () => {
        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "",
            repositories: [createRepository("jdoe/alpha")],
            hasNextPage: false
        });

        expect(getIsRepositorySearchNeeded({ cache, search: "anything" })).toBe(false);
    });

    it("a complete answer to a search doesn't mean every repository is known", () => {
        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "alp",
            repositories: [createRepository("jdoe/alpha")],
            hasNextPage: false
        });

        expect(cache.isComplete).toBe(false);
    });

    it("filters what is known, on the path and the name", () => {
        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "",
            repositories: [
                createRepository("jdoe/alpha"),
                createRepository("acme/beta", "My Project")
            ],
            hasNextPage: true
        });

        expect(
            getFullPaths(getRepositorySearchMatches({ cache, search: " ALPHA " }))
        ).toStrictEqual(["jdoe/alpha"]);
        expect(
            getFullPaths(getRepositorySearchMatches({ cache, search: "acme" }))
        ).toStrictEqual(["acme/beta"]);
        expect(
            getFullPaths(getRepositorySearchMatches({ cache, search: "my project" }))
        ).toStrictEqual(["acme/beta"]);
        expect(
            getRepositorySearchMatches({ cache: undefined, search: "" })
        ).toStrictEqual([]);
    });

    it("adds the answered repositories after the ones already shown", () => {
        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "",
            repositories: [createRepository("jdoe/app-b")],
            hasNextPage: true
        });

        const cache_searched = updateRepositorySearchCache({
            cache,
            search: "app",
            // NOTE: Most recent first, the known one must stay first anyway.
            repositories: [
                createRepository("jdoe/app-a"),
                createRepository("jdoe/app-b")
            ],
            hasNextPage: false
        });

        expect(
            getFullPaths(
                getRepositorySearchMatches({ cache: cache_searched, search: "app" })
            )
        ).toStrictEqual(["jdoe/app-b", "jdoe/app-a"]);
    });

    it("shows what the provider answered even if it doesn't look like a match", () => {
        const cache = updateRepositorySearchCache({
            cache: undefined,
            search: "topic",
            repositories: [createRepository("jdoe/alpha")],
            hasNextPage: false
        });

        expect(
            getFullPaths(getRepositorySearchMatches({ cache, search: "topic" }))
        ).toStrictEqual(["jdoe/alpha"]);
        expect(getRepositorySearchMatches({ cache, search: "other" })).toStrictEqual([]);
    });
});
