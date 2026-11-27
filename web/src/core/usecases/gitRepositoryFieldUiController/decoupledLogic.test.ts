import { describe, expect, it } from "vitest";
import type { ConnectedForge } from "core/usecases/gitForgesManagement";
import type { DisconnectedForge } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitForge";
import { updateRepositorySearchCache } from "core/usecases/gitForgesManagement/decoupledLogic/repositorySearch";
import { assert } from "tsafe/assert";
import {
    computeField,
    createFieldState,
    emptyValue,
    getForgeAction,
    getRepositorySearchCacheKey,
    getUrlInputOfValue,
    getValueOfUrlInput,
    type FieldState,
    type Value
} from "./decoupledLogic";

const gitLab: ConnectedForge = {
    forgeId: "gitlab",
    displayName: "GitLab",
    type: "gitlab",
    url: "https://gitlab.lan",
    logoUrl: undefined,
    username: "jdoe"
};

const gitHub: DisconnectedForge = {
    forgeId: "github",
    displayName: "GitHub",
    type: "github",
    logoUrl: undefined,
    isAddedByUser: true,
    connectionMethod: "personal-access-token",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const forgejo: DisconnectedForge = {
    forgeId: "forgejo",
    displayName: "Forgejo",
    type: "forgejo",
    logoUrl: undefined,
    isAddedByUser: false,
    connectionMethod: "oauth",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const repository: GitRepository = {
    id: "1",
    name: "project",
    fullPath: "group/project",
    description: undefined,
    webUrl: "https://gitlab.lan/group/project",
    httpCloneUrl: "https://gitlab.lan/group/project.git",
    defaultBranch: "main"
};

const cacheKey_gitLab = getRepositorySearchCacheKey({
    forgeId: "gitlab",
    username: "jdoe"
});

function compute(params: {
    value?: Value;
    fieldState?: Partial<FieldState>;
    connectedForges?: ConnectedForge[] | undefined;
    disconnectedForges?: DisconnectedForge[] | undefined;
    isCached?: boolean;
}) {
    const value = params.value ?? emptyValue;

    return computeField({
        fieldState: {
            ...createFieldState({ helmValuesPath: ["git"], isReadonly: false, value }),
            ...params.fieldState
        },
        value,
        connectedForges: "connectedForges" in params ? params.connectedForges : [gitLab],
        disconnectedForges:
            "disconnectedForges" in params ? params.disconnectedForges : [],
        repositorySearchCacheByKey: params.isCached
            ? {
                  [cacheKey_gitLab]: updateRepositorySearchCache({
                      cache: undefined,
                      search: "",
                      page: 1,
                      repositories: [repository],
                      hasNextPage: true
                  })
              }
            : {}
    });
}

describe("computeField", () => {
    it("searches the recent repositories of the first connected forge", () => {
        const { view, forgeId, repositoriesRequest } = compute({});

        expect(view.mode).toBe("forges");
        expect(forgeId).toBe("gitlab");
        expect(repositoriesRequest?.request).toEqual({
            forgeId: "gitlab",
            cacheKey: cacheKey_gitLab,
            search: "",
            page: 1,
            isDebounced: false
        });

        assert(view.forgePicker.status === "ready");
        expect(view.forgePicker.isSearching).toBe(true);
        expect(view.forgePicker.repositoryList?.heading).toBe("recent repositories");
    });

    it("debounces a typed search, asks nothing once it is cached", () => {
        expect(
            compute({ fieldState: { search: "proj" } }).repositoriesRequest?.request
                .isDebounced
        ).toBe(true);

        const { view, repositoriesRequest, nextPage } = compute({ isCached: true });

        expect(repositoriesRequest).toBe(undefined);
        expect(nextPage).toBe(2);
        assert(view.forgePicker.status === "ready");
        expect(view.forgePicker.repositoryList).toEqual({
            heading: "recent repositories",
            repositories: [repository],
            isEmpty: false,
            isMoreAvailable: true
        });
    });

    it("asks for the next page once requested, again after a failure", () => {
        const fieldState: Partial<FieldState> = {
            moreRequest: { forgeId: "gitlab", search: "", page: 2 },
            moreRequestCount: 1
        };

        const first = compute({ isCached: true, fieldState });

        expect(first.repositoriesRequest?.request.page).toBe(2);

        const failed = compute({
            isCached: true,
            fieldState: {
                ...fieldState,
                failedSearch: { forgeId: "gitlab", search: "" }
            }
        });

        expect(failed.view.error).toBe("search failed");
        assert(failed.view.forgePicker.status === "ready");
        expect(failed.view.forgePicker.isSearching).toBe(false);
        // NOTE: Same request, not made again until more is asked for.
        expect(failed.repositoriesRequest?.key).toBe(first.repositoriesRequest?.key);

        const retried = compute({
            isCached: true,
            fieldState: { ...fieldState, moreRequestCount: 2 }
        });

        expect(retried.repositoriesRequest?.key).not.toBe(first.repositoriesRequest?.key);
    });

    it("asks nothing while read only", () => {
        const value = emptyValue;

        const { repositoriesRequest } = computeField({
            fieldState: createFieldState({
                helmValuesPath: ["git"],
                isReadonly: true,
                value
            }),
            value,
            connectedForges: [gitLab],
            disconnectedForges: [],
            repositorySearchCacheByKey: {}
        });

        expect(repositoriesRequest).toBe(undefined);
    });

    it("shows the picked repository and lists its branches", () => {
        const value: Value = {
            forgeId: "gitlab",
            url: repository.httpCloneUrl,
            branch: "main"
        };

        const { view, repositoriesRequest, branchesRequest } = compute({
            value,
            fieldState: { branchSearch: "ma" }
        });

        expect(repositoriesRequest).toBe(undefined);
        expect(branchesRequest?.request).toEqual({
            forgeId: "gitlab",
            repositoryUrl: repository.httpCloneUrl,
            search: "ma"
        });

        assert(view.forgePicker.status === "ready");
        expect(view.forgePicker.isRepositoryPicked).toBe(true);
        expect(view.forgePicker.searchInputText).toBe("group/project");
        expect(view.forgePicker.forgeId).toBe("gitlab");
        expect(view.branch.isDisabled).toBe(false);
    });

    it("starts in the url mode on the url of an unknown forge", () => {
        const value: Value = {
            forgeId: "",
            url: "https://example.org/owner/repo.git",
            branch: ""
        };

        const { view, branchesRequest } = compute({ value });

        expect(view.mode).toBe("url");
        expect(view.urlInput.isAnonymous).toBe(true);
        expect(view.branch.isNoSuggestion).toBe(true);
        expect(branchesRequest).toBe(undefined);
    });

    it("deduces the forge of a pasted url on a connected forge", () => {
        const value: Value = { forgeId: "", url: repository.httpCloneUrl, branch: "" };

        const { view, branchesRequest } = compute({ value });

        expect(view.urlInput.isAnonymous).toBe(false);
        expect(branchesRequest?.request.forgeId).toBe("gitlab");
    });

    it("tells the repository's forge is no longer connected", () => {
        const value: Value = {
            forgeId: "gone",
            url: "https://gone.lan/group/project.git",
            branch: ""
        };

        const { view, branchesRequest } = compute({ value });

        expect(view.error).toBe("forge not connected");
        expect(branchesRequest).toBe(undefined);
        assert(view.forgePicker.status === "ready");
        expect(view.forgePicker.unknownRepository).toEqual({
            host: "gone.lan",
            isForgeNotConnected: true
        });
    });

    it("asks to connect the selected forge before listing its repositories", () => {
        const { view, repositoriesRequest } = compute({
            connectedForges: [gitLab],
            disconnectedForges: [forgejo],
            fieldState: { forgeId_selected: "forgejo" }
        });

        expect(repositoriesRequest).toBe(undefined);
        assert(view.forgePicker.status === "ready");
        expect(view.forgePicker.forgeToConnect?.forgeId).toBe("forgejo");
        expect(view.forgePicker.repositoryList).toBe(undefined);
        expect(view.forgePicker.forges.map(({ forgeId }) => forgeId)).toEqual([
            "gitlab",
            "forgejo"
        ]);
    });

    it("fixes first the forge of the repository", () => {
        const value: Value = {
            forgeId: "forgejo",
            url: "https://forgejo/group/project.git",
            branch: ""
        };

        const { view, forgeId } = compute({
            value,
            disconnectedForges: [forgejo, gitHub]
        });

        expect(forgeId).toBe("forgejo");
        expect(view.forgesToFix.map(({ forgeId }) => forgeId)).toEqual(["forgejo"]);
        // NOTE: The repository's forge is to fix, no error on top of it.
        expect(view.error).toBe(undefined);
    });

    it("offers the forges to connect when none is connected", () => {
        const { view } = compute({
            connectedForges: [],
            disconnectedForges: [forgejo, gitHub]
        });

        expect(view.mode).toBe("forges");
        expect(view.forgePicker.status).toBe("ready");

        const { view: view_url } = compute({
            connectedForges: [],
            disconnectedForges: [forgejo, gitHub],
            fieldState: { mode_selected: "url" }
        });

        expect(view_url.forgesToOffer?.isNoForgeConnected).toBe(true);
        expect(view_url.forgesToOffer?.forges.map(({ forgeId }) => forgeId)).toEqual([
            "forgejo",
            "github"
        ]);
    });

    it("has nothing to pick from without any forge", () => {
        const { view } = compute({ connectedForges: [], disconnectedForges: [] });

        expect(view.mode).toBe("url");
        expect(view.forgePicker).toEqual({ status: "none" });
    });

    it("waits for the forges", () => {
        const { view, repositoriesRequest } = compute({
            connectedForges: undefined,
            disconnectedForges: undefined
        });

        expect(view.forgePicker.status).toBe("loading");
        expect(repositoriesRequest).toBe(undefined);
    });
});

describe("getForgeAction", () => {
    it("depends on how the forge is connected and what went wrong", () => {
        expect(getForgeAction(forgejo)).toEqual({ type: "sign in", label: "sign in" });
        expect(getForgeAction({ ...forgejo, issue: "session expired" })).toEqual({
            type: "sign in",
            label: "reconnect"
        });
        expect(getForgeAction({ ...forgejo, error: { type: "sign in failed" } })).toEqual(
            { type: "sign in", label: "try again" }
        );
        expect(
            getForgeAction({ ...forgejo, error: { type: "grant scope conflict" } })
        ).toEqual({ type: "open account" });
        expect(getForgeAction(gitHub)).toEqual({ type: "manage" });
    });
});

describe("getValueOfUrlInput", () => {
    it("writes a clone url, with its connected forge", () => {
        expect(
            getValueOfUrlInput({
                urlInput: " https://gitlab.lan/group/project.git ",
                value: emptyValue,
                connectedForges: [gitLab]
            })
        ).toEqual({
            forgeId: "gitlab",
            url: "https://gitlab.lan/group/project.git",
            branch: ""
        });
    });

    it("empties the value while it isn't a clone url, credentials included", () => {
        const value: Value = { forgeId: "", url: "https://a.org/o/r", branch: "" };

        expect(
            getValueOfUrlInput({
                urlInput: "https://a.org",
                value,
                connectedForges: []
            })
        ).toEqual(emptyValue);
        expect(
            getValueOfUrlInput({
                urlInput: "https://u:t@a.org/o/r",
                value,
                connectedForges: []
            })
        ).toEqual(emptyValue);
        expect(
            getValueOfUrlInput({
                urlInput: "https://a.org",
                value: emptyValue,
                connectedForges: []
            })
        ).toBe(undefined);
    });
});

describe("getUrlInputOfValue", () => {
    it("follows a value changed elsewhere, keeps a draft", () => {
        const value: Value = { forgeId: "", url: "https://a.org/o/r", branch: "" };

        expect(getUrlInputOfValue({ urlInput: "", value })).toBe("https://a.org/o/r");
        expect(getUrlInputOfValue({ urlInput: "https://a.org/o/r ", value })).toBe(
            undefined
        );
        expect(getUrlInputOfValue({ urlInput: "https://a.or", value: emptyValue })).toBe(
            undefined
        );
        expect(
            getUrlInputOfValue({ urlInput: "https://a.org/o/r", value: emptyValue })
        ).toBe("");
    });
});
