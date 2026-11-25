import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProvider } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitProvider";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import {
    getIsRepositorySearchNeeded,
    getRepositorySearchMatches,
    getRepositorySearchNextPage,
    type RepositorySearchCache
} from "core/usecases/gitProvidersManagement/decoupledLogic/repositorySearch";
import {
    getHasUrlCredentials,
    getIsRepositoryUrl,
    getProviderIdOfRepositoryUrl,
    getRepositoryHost,
    getRepositoryPath
} from "core/usecases/gitProvidersManagement/decoupledLogic/repositoryUrl";

export type Value = FormField.GitRepository.Value;

export const emptyValue: Value = { providerId: "", url: "", branch: "" };

/**
 * "providers": the repository is picked among the ones of a connected provider.
 * "url": the clone url is typed, the provider is deduced from it (none: anonymous clone).
 */
export type Mode = "providers" | "url";

/** What the user did in a field, the value itself is in the launcher's helm values */
export type FieldState = {
    helmValuesPath: (string | number)[];
    isReadonly: boolean;
    /** undefined: derived from the value, see computeField */
    mode_selected: Mode | undefined;
    /** In the Git profile select, for the next search */
    providerId_selected: string | undefined;
    search: string;
    failedSearch: { providerId: string; search: string } | undefined;
    /** The user asked for more matches of this search */
    moreRequest: { providerId: string; search: string; page: number } | undefined;
    /** Incremented on each "more": asking again after a failure runs the search again */
    moreRequestCount: number;
    /** The url being typed, only written to the value once it is a clone url */
    urlInput: string;
    branchSearch: string;
    branches:
        | { status: "idle" }
        | { status: "loading" }
        | { status: "loaded"; branches: string[] };
};

export function createFieldState(params: {
    helmValuesPath: (string | number)[];
    isReadonly: boolean;
    value: Value;
}): FieldState {
    const { helmValuesPath, isReadonly, value } = params;

    return {
        helmValuesPath,
        isReadonly,
        mode_selected: undefined,
        providerId_selected: value.providerId === "" ? undefined : value.providerId,
        search: "",
        failedSearch: undefined,
        moreRequest: undefined,
        moreRequestCount: 0,
        urlInput: value.url,
        branchSearch: "",
        branches: { status: "idle" }
    };
}

/** A field is identified by where its value is in the helm values */
export function getFieldId(helmValuesPath: (string | number)[]): string {
    return JSON.stringify(helmValuesPath);
}

/**
 * - "to connect": never connected, or signed out. Nothing went wrong.
 * - "session expired": was connected, signing in again restores it.
 * - "failed": the last attempt failed, or the provider refuses the token.
 */
export type DisconnectedProviderState = "to connect" | "session expired" | "failed";

/**
 * What to do so that the provider lists its repositories: signing in with OAuth (a
 * provider of the region), the manage dialog for a token, or, for a grant only the
 * provider can revoke, the account.
 */
export type ProviderAction =
    | { type: "sign in"; label: "sign in" | "reconnect" | "try again" }
    | { type: "manage" }
    | { type: "open account" };

export type DisconnectedProviderView = DisconnectedProvider & {
    state: DisconnectedProviderState;
    action: ProviderAction;
};

export function getDisconnectedProviderState(
    provider: DisconnectedProvider
): DisconnectedProviderState {
    if (provider.error !== undefined) {
        return "failed";
    }

    switch (provider.issue) {
        case "not connected":
            return "to connect";
        case "session expired":
            return "session expired";
        case "personal access token rejected":
        case "loading failed":
            return "failed";
    }
}

export function getProviderAction(provider: DisconnectedProvider): ProviderAction {
    if (provider.error?.type === "grant scope conflict") {
        return { type: "open account" };
    }

    if (provider.connectionMethod === "personal-access-token") {
        return { type: "manage" };
    }

    switch (getDisconnectedProviderState(provider)) {
        case "to connect":
            return { type: "sign in", label: "sign in" };
        case "session expired":
            return { type: "sign in", label: "reconnect" };
        case "failed":
            return { type: "sign in", label: "try again" };
    }
}

/** Everything the field displays */
export type FieldView = {
    value: Value;
    isReadonly: boolean;
    mode: Mode;
    error: "search failed" | "provider not connected" | undefined;
    /** Mode url: what stopped working, or what the repository needs */
    providersToFix: DisconnectedProviderView[];
    /** Mode url: what can be connected to pick repositories. undefined: not shown */
    providersToOffer:
        | { providers: DisconnectedProviderView[]; isNoProviderConnected: boolean }
        | undefined;
    /**
     * Mode providers. "loading": the providers aren't known yet. "none": nothing to
     * pick from, and nothing to connect. "nothing to pick": what to connect is shown
     * elsewhere.
     */
    providerPicker:
        | {
              status: "ready" | "loading";
              /** The connected ones, then the others */
              providers: (ConnectedProvider | DisconnectedProviderView)[];
              /** "": the repository isn't on a provider of the list, see unknownRepository */
              providerId: string;
              unknownRepository:
                  | { host: string; isProviderNotConnected: boolean }
                  | undefined;
              /** The picked repository, or the search */
              searchInputText: string;
              isRepositoryPicked: boolean;
              isSearching: boolean;
              /** The selected provider must be connected to list its repositories */
              providerToConnect: DisconnectedProviderView | undefined;
              /** undefined: not shown */
              repositoryList:
                  | {
                        heading: "recent repositories" | "matching repositories";
                        repositories: GitRepository[];
                        isEmpty: boolean;
                        isMoreAvailable: boolean;
                    }
                  | undefined;
          }
        | { status: "none" | "nothing to pick" };
    /** Mode url */
    urlInput: {
        text: string;
        hasCredentials: boolean;
        /** On none of the connected providers: cloned without credentials */
        isAnonymous: boolean;
    };
    branch: {
        isDisabled: boolean;
        /** Disabled until a repository is picked or typed */
        isRepositoryMissing: boolean;
        branches: string[];
        isLoading: boolean;
        /** Typed only: the repository isn't on a connected provider */
        isNoSuggestion: boolean;
    };
};

/** What must be asked to the provider for the field to show what it should */
export type RepositoriesRequest = {
    providerId: string;
    /** Of the repository search cache */
    cacheKey: string;
    search: string;
    page: number;
    /** Immediately when nothing is typed or more is asked for, debounced otherwise */
    isDebounced: boolean;
};

export type BranchesRequest = {
    providerId: string;
    repositoryUrl: string;
    search: string;
};

/** By provider and account: another account of the provider has other repositories */
export function getRepositorySearchCacheKey(params: {
    providerId: string;
    username: string | undefined;
}): string {
    return JSON.stringify([params.providerId, params.username]);
}

export function computeField(params: {
    fieldState: FieldState;
    value: Value;
    /** undefined while loading */
    connectedProviders: ConnectedProvider[] | undefined;
    /** undefined while loading */
    disconnectedProviders: DisconnectedProvider[] | undefined;
    repositorySearchCacheByKey: Record<string, RepositorySearchCache | undefined>;
}): {
    view: FieldView;
    /** The provider the search is on */
    providerId: string | undefined;
    nextPage: number | undefined;
    /** Identifies the request: a new one is made when it changes. undefined: none */
    repositoriesRequest: { key: string; request: RepositoriesRequest } | undefined;
    branchesRequest: { key: string; request: BranchesRequest } | undefined;
} {
    const { fieldState, value, connectedProviders, repositorySearchCacheByKey } = params;
    const { isReadonly, search } = fieldState;

    const disconnectedProviders = params.disconnectedProviders?.map(
        (provider): DisconnectedProviderView => ({
            ...provider,
            state: getDisconnectedProviderState(provider),
            action: getProviderAction(provider)
        })
    );

    const providersToFix = (disconnectedProviders ?? []).filter(
        provider =>
            provider.issue !== "not connected" ||
            provider.error !== undefined ||
            provider.providerId === value.providerId
    );

    const selectableProviders: (ConnectedProvider | DisconnectedProviderView)[] = [
        ...(connectedProviders ?? []),
        ...(disconnectedProviders ?? [])
    ];

    // NOTE: Until the user picks one: the url of an unknown provider, or no provider to pick from.
    const mode: Mode =
        fieldState.mode_selected ??
        ((value.url !== "" && value.providerId === "") ||
        (connectedProviders !== undefined && selectableProviders.length === 0)
            ? "url"
            : "providers");

    const providerId = (() => {
        const { providerId_selected } = fieldState;

        if (
            providerId_selected !== undefined &&
            selectableProviders.some(
                ({ providerId }) => providerId === providerId_selected
            )
        ) {
            return providerId_selected;
        }

        // NOTE: The provider of the repository, to be fixed first.
        if (providersToFix.some(({ providerId }) => providerId === value.providerId)) {
            return value.providerId;
        }

        // NOTE: The first one, once the providers are known, when nothing is picked yet.
        return (
            connectedProviders?.[0]?.providerId ?? disconnectedProviders?.[0]?.providerId
        );
    })();

    /** The selected provider can't list its repositories until it is connected */
    const provider_disconnected = disconnectedProviders?.find(
        provider => provider.providerId === providerId
    );

    /** The search input, instead of the picked repository */
    const isRepositoryPickerVisible =
        mode === "providers" && providerId !== undefined && value.url === "";

    const isRepositoryListVisible =
        isRepositoryPickerVisible && provider_disconnected === undefined;

    const username_provider = connectedProviders?.find(
        provider => provider.providerId === providerId
    )?.username;

    const cacheKey =
        providerId === undefined
            ? undefined
            : getRepositorySearchCacheKey({ providerId, username: username_provider });

    const cache =
        cacheKey === undefined ? undefined : repositorySearchCacheByKey[cacheKey];

    const isSearchNeeded = getIsRepositorySearchNeeded({ cache, search });

    // NOTE: What is known right away, what the provider answers is added to it afterward.
    const repositories = getRepositorySearchMatches({ cache, search });

    const nextPage = getRepositorySearchNextPage({ cache, search });

    const page_toFetch: number | undefined = (() => {
        if (isSearchNeeded) {
            return 1;
        }

        const { moreRequest } = fieldState;

        if (
            moreRequest !== undefined &&
            moreRequest.providerId === providerId &&
            moreRequest.search === search &&
            moreRequest.page === nextPage
        ) {
            return moreRequest.page;
        }

        return undefined;
    })();

    const isSearchFailed =
        fieldState.failedSearch?.providerId === providerId &&
        fieldState.failedSearch?.search === search;

    const isSearching =
        isRepositoryListVisible &&
        !isReadonly &&
        page_toFetch !== undefined &&
        !isSearchFailed;

    const repositoriesRequest = (() => {
        if (
            !isRepositoryListVisible ||
            isReadonly ||
            providerId === undefined ||
            cacheKey === undefined ||
            page_toFetch === undefined
        ) {
            return undefined;
        }

        const request: RepositoriesRequest = {
            providerId,
            cacheKey,
            search,
            page: page_toFetch,
            isDebounced: search !== "" && page_toFetch === 1
        };

        return {
            // NOTE: Asked again after a failure, by asking for more.
            key: JSON.stringify([request, fieldState.moreRequestCount]),
            request
        };
    })();

    // NOTE: e.g. a launch saved while connected to a provider the user since signed out of.
    const isProviderNotConnected =
        value.providerId !== "" &&
        connectedProviders !== undefined &&
        !connectedProviders.some(({ providerId }) => providerId === value.providerId);

    // NOTE: The provider of the repository, not the one selected for the next search.
    const providerId_repository =
        value.url === ""
            ? undefined
            : value.providerId !== ""
              ? value.providerId
              : getProviderIdOfRepositoryUrl({
                    providers: connectedProviders ?? [],
                    url: value.url
                });

    const branchesRequest = (() => {
        if (providerId_repository === undefined || isReadonly || isProviderNotConnected) {
            return undefined;
        }

        const request: BranchesRequest = {
            providerId: providerId_repository,
            repositoryUrl: value.url,
            search: fieldState.branchSearch
        };

        return {
            key: JSON.stringify([
                request,
                // NOTE: Listed again as another account.
                connectedProviders?.find(
                    ({ providerId }) => providerId === providerId_repository
                )?.username
            ]),
            request
        };
    })();

    const isUrlOnConnectedProvider =
        value.url !== "" &&
        connectedProviders?.some(
            ({ providerId }) => providerId === providerId_repository
        ) === true;

    const providersToOffer = (() => {
        const providers = disconnectedProviders?.filter(
            provider => !providersToFix.includes(provider)
        );

        const isNoProviderConnected = connectedProviders?.length === 0;

        if (
            isReadonly ||
            providers === undefined ||
            providers.length === 0 ||
            mode !== "url" ||
            !(isNoProviderConnected || providers.some(({ isSigningIn }) => isSigningIn))
        ) {
            return undefined;
        }

        return { providers, isNoProviderConnected };
    })();

    const providerPicker = ((): FieldView["providerPicker"] => {
        if (connectedProviders !== undefined && selectableProviders.length === 0) {
            return {
                status: disconnectedProviders?.length !== 0 ? "nothing to pick" : "none"
            };
        }

        const isRepositoryPicked = !isRepositoryPickerVisible && value.url !== "";

        // NOTE: "" when the current repository isn't on a selectable provider.
        const providerId_select =
            isRepositoryPickerVisible || value.url === ""
                ? (providerId ?? "")
                : (selectableProviders.find(
                      ({ providerId }) => providerId === providerId_repository
                  )?.providerId ?? "");

        return {
            status: connectedProviders === undefined ? "loading" : "ready",
            providers: selectableProviders,
            providerId: providerId_select,
            unknownRepository:
                providerId_select === "" && value.url !== ""
                    ? { host: getRepositoryHost(value.url), isProviderNotConnected }
                    : undefined,
            searchInputText: isRepositoryPicked ? getRepositoryPath(value.url) : search,
            isRepositoryPicked,
            isSearching,
            providerToConnect: isRepositoryPickerVisible
                ? provider_disconnected
                : undefined,
            repositoryList: !isRepositoryListVisible
                ? undefined
                : {
                      heading:
                          search === "" ? "recent repositories" : "matching repositories",
                      repositories,
                      isEmpty:
                          cache !== undefined &&
                          !isSearching &&
                          !isSearchFailed &&
                          repositories.length === 0,
                      isMoreAvailable: nextPage !== undefined && repositories.length !== 0
                  }
        };
    })();

    const view: FieldView = {
        value,
        isReadonly,
        mode,
        error:
            isSearchFailed && isRepositoryListVisible
                ? "search failed"
                : isProviderNotConnected &&
                    !providersToFix.some(
                        ({ providerId }) => providerId === value.providerId
                    )
                  ? "provider not connected"
                  : undefined,
        providersToFix,
        providersToOffer,
        providerPicker,
        urlInput: {
            text: fieldState.urlInput,
            hasCredentials: getHasUrlCredentials(fieldState.urlInput.trim()),
            isAnonymous:
                value.url !== "" && !isProviderNotConnected && !isUrlOnConnectedProvider
        },
        branch: {
            isDisabled: isReadonly || value.url === "",
            isRepositoryMissing: value.url === "",
            branches:
                fieldState.branches.status === "loaded"
                    ? fieldState.branches.branches
                    : [],
            isLoading: fieldState.branches.status === "loading",
            isNoSuggestion: value.url !== "" && providerId_repository === undefined
        }
    };

    return { view, providerId, nextPage, repositoriesRequest, branchesRequest };
}

/**
 * The value written when the url input changes. undefined: the value stays. Not
 * written until it looks like a clone url, a host and a path, never with credentials
 * in it: the helm values end up in shared launch urls.
 */
export function getValueOfUrlInput(params: {
    urlInput: string;
    value: Value;
    connectedProviders: ConnectedProvider[] | undefined;
}): Value | undefined {
    const { value, connectedProviders } = params;

    const url = params.urlInput.trim();

    if (!getIsRepositoryUrl(url)) {
        return value.url === "" ? undefined : emptyValue;
    }

    if (url === value.url) {
        return undefined;
    }

    return {
        providerId:
            getProviderIdOfRepositoryUrl({ providers: connectedProviders ?? [], url }) ??
            "",
        url,
        branch: ""
    };
}

/**
 * The url input once the value changed from elsewhere (the yaml editor). undefined: it
 * stays. Only a draft that isn't a url yet, which leaves the value empty, is kept.
 */
export function getUrlInputOfValue(params: {
    urlInput: string;
    value: Value;
}): string | undefined {
    const { urlInput, value } = params;

    if (value.url === urlInput.trim()) {
        return undefined;
    }

    if (value.url === "" && !getIsRepositoryUrl(urlInput.trim())) {
        return undefined;
    }

    return value.url;
}
