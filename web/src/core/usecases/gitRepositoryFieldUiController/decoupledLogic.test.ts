import { describe, expect, it } from "vitest";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProvider } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitProvider";
import { updateRepositorySearchCache } from "core/usecases/gitProvidersManagement/decoupledLogic/repositorySearch";
import { assert } from "tsafe/assert";
import {
    computeField,
    createFieldState,
    emptyValue,
    getProviderAction,
    getRepositorySearchCacheKey,
    getUrlInputOfValue,
    getValueOfUrlInput,
    type FieldState,
    type Value
} from "./decoupledLogic";

const gitLab: ConnectedProvider = {
    providerId: "gitlab",
    displayName: "GitLab",
    type: "gitlab",
    url: "https://gitlab.lan",
    logoUrl: undefined,
    username: "jdoe"
};

const gitHub: DisconnectedProvider = {
    providerId: "github",
    displayName: "GitHub",
    type: "github",
    logoUrl: undefined,
    isAddedByUser: true,
    connectionMethod: "personal-access-token",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const forgejo: DisconnectedProvider = {
    providerId: "forgejo",
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
    providerId: "gitlab",
    username: "jdoe"
});

function compute(params: {
    value?: Value;
    fieldState?: Partial<FieldState>;
    connectedProviders?: ConnectedProvider[] | undefined;
    disconnectedProviders?: DisconnectedProvider[] | undefined;
    isCached?: boolean;
}) {
    const value = params.value ?? emptyValue;

    return computeField({
        fieldState: {
            ...createFieldState({ helmValuesPath: ["git"], isReadonly: false, value }),
            ...params.fieldState
        },
        value,
        connectedProviders:
            "connectedProviders" in params ? params.connectedProviders : [gitLab],
        disconnectedProviders:
            "disconnectedProviders" in params ? params.disconnectedProviders : [],
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
    it("searches the recent repositories of the first connected provider", () => {
        const { view, providerId, repositoriesRequest } = compute({});

        expect(view.mode).toBe("providers");
        expect(providerId).toBe("gitlab");
        expect(repositoriesRequest?.request).toEqual({
            providerId: "gitlab",
            cacheKey: cacheKey_gitLab,
            search: "",
            page: 1,
            isDebounced: false
        });

        assert(view.providerPicker.status === "ready");
        expect(view.providerPicker.isSearching).toBe(true);
        expect(view.providerPicker.repositoryList?.heading).toBe("recent repositories");
    });

    it("debounces a typed search, asks nothing once it is cached", () => {
        expect(
            compute({ fieldState: { search: "proj" } }).repositoriesRequest?.request
                .isDebounced
        ).toBe(true);

        const { view, repositoriesRequest, nextPage } = compute({ isCached: true });

        expect(repositoriesRequest).toBe(undefined);
        expect(nextPage).toBe(2);
        assert(view.providerPicker.status === "ready");
        expect(view.providerPicker.repositoryList).toEqual({
            heading: "recent repositories",
            repositories: [repository],
            isEmpty: false,
            isMoreAvailable: true
        });
    });

    it("asks for the next page once requested, again after a failure", () => {
        const fieldState: Partial<FieldState> = {
            moreRequest: { providerId: "gitlab", search: "", page: 2 },
            moreRequestCount: 1
        };

        const first = compute({ isCached: true, fieldState });

        expect(first.repositoriesRequest?.request.page).toBe(2);

        const failed = compute({
            isCached: true,
            fieldState: {
                ...fieldState,
                failedSearch: { providerId: "gitlab", search: "" }
            }
        });

        expect(failed.view.error).toBe("search failed");
        assert(failed.view.providerPicker.status === "ready");
        expect(failed.view.providerPicker.isSearching).toBe(false);
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
            connectedProviders: [gitLab],
            disconnectedProviders: [],
            repositorySearchCacheByKey: {}
        });

        expect(repositoriesRequest).toBe(undefined);
    });

    it("shows the picked repository and lists its branches", () => {
        const value: Value = {
            providerId: "gitlab",
            url: repository.httpCloneUrl,
            branch: "main"
        };

        const { view, repositoriesRequest, branchesRequest } = compute({
            value,
            fieldState: { branchSearch: "ma" }
        });

        expect(repositoriesRequest).toBe(undefined);
        expect(branchesRequest?.request).toEqual({
            providerId: "gitlab",
            repositoryUrl: repository.httpCloneUrl,
            search: "ma"
        });

        assert(view.providerPicker.status === "ready");
        expect(view.providerPicker.isRepositoryPicked).toBe(true);
        expect(view.providerPicker.searchInputText).toBe("group/project");
        expect(view.providerPicker.providerId).toBe("gitlab");
        expect(view.branch.isDisabled).toBe(false);
    });

    it("starts in the url mode on the url of an unknown provider", () => {
        const value: Value = {
            providerId: "",
            url: "https://example.org/owner/repo.git",
            branch: ""
        };

        const { view, branchesRequest } = compute({ value });

        expect(view.mode).toBe("url");
        expect(view.urlInput.isAnonymous).toBe(true);
        expect(view.branch.isNoSuggestion).toBe(true);
        expect(branchesRequest).toBe(undefined);
    });

    it("deduces the provider of a pasted url on a connected provider", () => {
        const value: Value = { providerId: "", url: repository.httpCloneUrl, branch: "" };

        const { view, branchesRequest } = compute({ value });

        expect(view.urlInput.isAnonymous).toBe(false);
        expect(branchesRequest?.request.providerId).toBe("gitlab");
    });

    it("tells the repository's provider is no longer connected", () => {
        const value: Value = {
            providerId: "gone",
            url: "https://gone.lan/group/project.git",
            branch: ""
        };

        const { view, branchesRequest } = compute({ value });

        expect(view.error).toBe("provider not connected");
        expect(branchesRequest).toBe(undefined);
        assert(view.providerPicker.status === "ready");
        expect(view.providerPicker.unknownRepository).toEqual({
            host: "gone.lan",
            isProviderNotConnected: true
        });
    });

    it("asks to connect the selected provider before listing its repositories", () => {
        const { view, repositoriesRequest } = compute({
            connectedProviders: [gitLab],
            disconnectedProviders: [forgejo],
            fieldState: { providerId_selected: "forgejo" }
        });

        expect(repositoriesRequest).toBe(undefined);
        assert(view.providerPicker.status === "ready");
        expect(view.providerPicker.providerToConnect?.providerId).toBe("forgejo");
        expect(view.providerPicker.repositoryList).toBe(undefined);
        expect(view.providerPicker.providers.map(({ providerId }) => providerId)).toEqual(
            ["gitlab", "forgejo"]
        );
    });

    it("fixes first the provider of the repository", () => {
        const value: Value = {
            providerId: "forgejo",
            url: "https://forgejo/group/project.git",
            branch: ""
        };

        const { view, providerId } = compute({
            value,
            disconnectedProviders: [forgejo, gitHub]
        });

        expect(providerId).toBe("forgejo");
        expect(view.providersToFix.map(({ providerId }) => providerId)).toEqual([
            "forgejo"
        ]);
        // NOTE: The repository's provider is to fix, no error on top of it.
        expect(view.error).toBe(undefined);
    });

    it("offers the providers to connect when none is connected", () => {
        const { view } = compute({
            connectedProviders: [],
            disconnectedProviders: [forgejo, gitHub]
        });

        expect(view.mode).toBe("providers");
        expect(view.providerPicker.status).toBe("ready");

        const { view: view_url } = compute({
            connectedProviders: [],
            disconnectedProviders: [forgejo, gitHub],
            fieldState: { mode_selected: "url" }
        });

        expect(view_url.providersToOffer?.isNoProviderConnected).toBe(true);
        expect(
            view_url.providersToOffer?.providers.map(({ providerId }) => providerId)
        ).toEqual(["forgejo", "github"]);
    });

    it("has nothing to pick from without any provider", () => {
        const { view } = compute({ connectedProviders: [], disconnectedProviders: [] });

        expect(view.mode).toBe("url");
        expect(view.providerPicker).toEqual({ status: "none" });
    });

    it("waits for the providers", () => {
        const { view, repositoriesRequest } = compute({
            connectedProviders: undefined,
            disconnectedProviders: undefined
        });

        expect(view.providerPicker.status).toBe("loading");
        expect(repositoriesRequest).toBe(undefined);
    });
});

describe("getProviderAction", () => {
    it("depends on how the provider is connected and what went wrong", () => {
        expect(getProviderAction(forgejo)).toEqual({ type: "sign in", label: "sign in" });
        expect(getProviderAction({ ...forgejo, issue: "session expired" })).toEqual({
            type: "sign in",
            label: "reconnect"
        });
        expect(
            getProviderAction({ ...forgejo, error: { type: "sign in failed" } })
        ).toEqual({ type: "sign in", label: "try again" });
        expect(
            getProviderAction({ ...forgejo, error: { type: "grant scope conflict" } })
        ).toEqual({ type: "open account" });
        expect(getProviderAction(gitHub)).toEqual({ type: "manage" });
    });
});

describe("getValueOfUrlInput", () => {
    it("writes a clone url, with its connected provider", () => {
        expect(
            getValueOfUrlInput({
                urlInput: " https://gitlab.lan/group/project.git ",
                value: emptyValue,
                connectedProviders: [gitLab]
            })
        ).toEqual({
            providerId: "gitlab",
            url: "https://gitlab.lan/group/project.git",
            branch: ""
        });
    });

    it("empties the value while it isn't a clone url, credentials included", () => {
        const value: Value = { providerId: "", url: "https://a.org/o/r", branch: "" };

        expect(
            getValueOfUrlInput({
                urlInput: "https://a.org",
                value,
                connectedProviders: []
            })
        ).toEqual(emptyValue);
        expect(
            getValueOfUrlInput({
                urlInput: "https://u:t@a.org/o/r",
                value,
                connectedProviders: []
            })
        ).toEqual(emptyValue);
        expect(
            getValueOfUrlInput({
                urlInput: "https://a.org",
                value: emptyValue,
                connectedProviders: []
            })
        ).toBe(undefined);
    });
});

describe("getUrlInputOfValue", () => {
    it("follows a value changed elsewhere, keeps a draft", () => {
        const value: Value = { providerId: "", url: "https://a.org/o/r", branch: "" };

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
