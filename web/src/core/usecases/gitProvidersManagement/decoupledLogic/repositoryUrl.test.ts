import { describe, expect, it } from "vitest";
import {
    getIsRepositoryUrl,
    getHasUrlCredentials,
    getRepositoryPath,
    getRepositoryHost,
    getProviderIdOfRepositoryUrl
} from "./repositoryUrl";

describe("getIsRepositoryUrl", () => {
    it("accepts a host and a path", () => {
        expect(getIsRepositoryUrl("https://github.com/owner/repo.git")).toBe(true);
        expect(getIsRepositoryUrl("http://gitlab.lan:8080/group/project")).toBe(true);
    });

    it("rejects what isn't a clone url yet", () => {
        expect(getIsRepositoryUrl("")).toBe(false);
        expect(getIsRepositoryUrl("https://github.com")).toBe(false);
        expect(getIsRepositoryUrl("https://github.com/")).toBe(false);
        expect(getIsRepositoryUrl("git@github.com:owner/repo.git")).toBe(false);
    });

    it("rejects credentials in the url", () => {
        expect(getIsRepositoryUrl("https://user:token@github.com/owner/repo.git")).toBe(
            false
        );
        expect(getIsRepositoryUrl("https://token@github.com/owner/repo.git")).toBe(false);
    });
});

describe("getHasUrlCredentials", () => {
    it("detects a user or a password", () => {
        expect(getHasUrlCredentials("https://user:token@github.com/o/r")).toBe(true);
        expect(getHasUrlCredentials("https://github.com/o/r")).toBe(false);
        expect(getHasUrlCredentials("not a url")).toBe(false);
    });
});

describe("getRepositoryPath and getRepositoryHost", () => {
    it("reads them from the clone url", () => {
        expect(getRepositoryPath("https://github.com/owner/repo.git")).toBe("owner/repo");
        expect(getRepositoryHost("https://gitlab.lan:8080/g/p")).toBe("gitlab.lan:8080");
    });

    it("falls back on the url itself", () => {
        expect(getRepositoryPath("not a url")).toBe("not a url");
        expect(getRepositoryPath("https://github.com")).toBe("https://github.com");
        expect(getRepositoryHost("not a url")).toBe("not a url");
    });
});

describe("getProviderIdOfRepositoryUrl", () => {
    const providers = [
        { providerId: "gitlab-oauth", url: "https://gitlab.lan" },
        { providerId: "gitlab-pat", url: "https://gitlab.lan" },
        { providerId: "github", url: "https://github.com" }
    ];

    it("is the first provider the url starts with", () => {
        expect(
            getProviderIdOfRepositoryUrl({
                providers,
                url: " https://gitlab.lan/group/project.git "
            })
        ).toBe("gitlab-oauth");
    });

    it("needs the provider url followed by a path", () => {
        expect(
            getProviderIdOfRepositoryUrl({ providers, url: "https://gitlab.lanx/g/p" })
        ).toBe(undefined);
    });
});

describe("getProviderIdOfRepositoryUrl, canonical urls", () => {
    it("ignores the host casing and the default port", () => {
        expect(
            getProviderIdOfRepositoryUrl({
                providers: [{ providerId: "gitlab", url: "https://GitLab.Example:443" }],
                url: "https://gitlab.example/group/repo.git"
            })
        ).toBe("gitlab");
    });
});

describe("repository urls, edge cases", () => {
    it("rejects what the URL parser rejects", () => {
        expect(getIsRepositoryUrl("https://git.example.com:bogus/group/repo.git")).toBe(
            false
        );
    });

    it("prefers the forge hosted below another one", () => {
        expect(
            getProviderIdOfRepositoryUrl({
                providers: [
                    { providerId: "root", url: "https://git.example.com" },
                    { providerId: "gitlab", url: "https://git.example.com/gitlab" }
                ],
                url: "https://git.example.com/gitlab/group/repo.git"
            })
        ).toBe("gitlab");
    });
});
