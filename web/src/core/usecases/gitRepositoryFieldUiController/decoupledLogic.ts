import type { ConnectedForge } from "core/usecases/gitForgesManagement";
import type { DisconnectedForge } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitForge";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import {
    getIsRepositorySearchNeeded,
    getRepositorySearchMatches,
    getRepositorySearchNextPage,
    type RepositorySearchCache
} from "core/usecases/gitForgesManagement/decoupledLogic/repositorySearch";
import {
    getHasUrlCredentials,
    getIsRepositoryUrl,
    getForgeIdOfRepositoryUrl,
    getRepositoryHost,
    getRepositoryPath
} from "core/usecases/gitForgesManagement/decoupledLogic/repositoryUrl";

export type Value = FormField.GitRepository.Value;

export const emptyValue: Value = { forgeId: "", url: "", branch: "" };

/**
 * "forges": the repository is picked among the ones of a connected forge.
 * "url": the clone url is typed, the forge is deduced from it (none: anonymous clone).
 */
export type Mode = "forges" | "url";

/** What the user did in a field, the value itself is in the launcher's helm values */
export type FieldState = {
    helmValuesPath: (string | number)[];
    isReadonly: boolean;
    /** undefined: derived from the value, see computeField */
    mode_selected: Mode | undefined;
    /** In the Git profile select, for the next search */
    forgeId_selected: string | undefined;
    search: string;
    failedSearch: { forgeId: string; search: string } | undefined;
    /** The user asked for more matches of this search */
    moreRequest: { forgeId: string; search: string; page: number } | undefined;
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
        forgeId_selected: value.forgeId === "" ? undefined : value.forgeId,
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
 * - "failed": the last attempt failed, or the forge refuses the token.
 */
export type DisconnectedForgeState = "to connect" | "session expired" | "failed";

/**
 * What to do so that the forge lists its repositories: signing in with OAuth (a
 * forge of the region), the manage dialog for a token, or, for a grant only the
 * forge can revoke, the account.
 */
export type ForgeAction =
    | { type: "sign in"; label: "sign in" | "reconnect" | "try again" }
    | { type: "manage" }
    | { type: "open account" };

export type DisconnectedForgeView = DisconnectedForge & {
    state: DisconnectedForgeState;
    action: ForgeAction;
};

export function getDisconnectedForgeState(
    forge: DisconnectedForge
): DisconnectedForgeState {
    if (forge.error !== undefined) {
        return "failed";
    }

    switch (forge.issue) {
        case "not connected":
            return "to connect";
        case "session expired":
            return "session expired";
        case "personal access token rejected":
        case "loading failed":
            return "failed";
    }
}

export function getForgeAction(forge: DisconnectedForge): ForgeAction {
    if (forge.error?.type === "grant scope conflict") {
        return { type: "open account" };
    }

    if (forge.connectionMethod === "personal-access-token") {
        return { type: "manage" };
    }

    switch (getDisconnectedForgeState(forge)) {
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
    error: "search failed" | "forge not connected" | undefined;
    /** Mode url: what stopped working, or what the repository needs */
    forgesToFix: DisconnectedForgeView[];
    /** Mode url: what can be connected to pick repositories. undefined: not shown */
    forgesToOffer:
        | { forges: DisconnectedForgeView[]; isNoForgeConnected: boolean }
        | undefined;
    /**
     * Mode forges. "loading": the forges aren't known yet. "none": nothing to
     * pick from, and nothing to connect. "nothing to pick": what to connect is shown
     * elsewhere.
     */
    forgePicker:
        | {
              status: "ready" | "loading";
              /** The connected ones, then the others */
              forges: (ConnectedForge | DisconnectedForgeView)[];
              /** "": the repository isn't on a forge of the list, see unknownRepository */
              forgeId: string;
              unknownRepository:
                  | { host: string; isForgeNotConnected: boolean }
                  | undefined;
              /** The picked repository, or the search */
              searchInputText: string;
              isRepositoryPicked: boolean;
              isSearching: boolean;
              /** The selected forge must be connected to list its repositories */
              forgeToConnect: DisconnectedForgeView | undefined;
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
        /** On none of the connected forges: cloned without credentials */
        isAnonymous: boolean;
    };
    branch: {
        isDisabled: boolean;
        /** Disabled until a repository is picked or typed */
        isRepositoryMissing: boolean;
        branches: string[];
        isLoading: boolean;
        /** Typed only: the repository isn't on a connected forge */
        isNoSuggestion: boolean;
    };
};

/** What must be asked to the forge for the field to show what it should */
export type RepositoriesRequest = {
    forgeId: string;
    /** Of the repository search cache */
    cacheKey: string;
    search: string;
    page: number;
    /** Immediately when nothing is typed or more is asked for, debounced otherwise */
    isDebounced: boolean;
};

export type BranchesRequest = {
    forgeId: string;
    repositoryUrl: string;
    search: string;
};

/** By forge and account: another account of the forge has other repositories */
export function getRepositorySearchCacheKey(params: {
    forgeId: string;
    username: string | undefined;
}): string {
    return JSON.stringify([params.forgeId, params.username]);
}

export function computeField(params: {
    fieldState: FieldState;
    value: Value;
    /** undefined while loading */
    connectedForges: ConnectedForge[] | undefined;
    /** undefined while loading */
    disconnectedForges: DisconnectedForge[] | undefined;
    repositorySearchCacheByKey: Record<string, RepositorySearchCache | undefined>;
}): {
    view: FieldView;
    /** The forge the search is on */
    forgeId: string | undefined;
    nextPage: number | undefined;
    /** Identifies the request: a new one is made when it changes. undefined: none */
    repositoriesRequest: { key: string; request: RepositoriesRequest } | undefined;
    branchesRequest: { key: string; request: BranchesRequest } | undefined;
} {
    const { fieldState, value, connectedForges, repositorySearchCacheByKey } = params;
    const { isReadonly, search } = fieldState;

    const disconnectedForges = params.disconnectedForges?.map(
        (forge): DisconnectedForgeView => ({
            ...forge,
            state: getDisconnectedForgeState(forge),
            action: getForgeAction(forge)
        })
    );

    const forgesToFix = (disconnectedForges ?? []).filter(
        forge =>
            forge.issue !== "not connected" ||
            forge.error !== undefined ||
            forge.forgeId === value.forgeId
    );

    const selectableForges: (ConnectedForge | DisconnectedForgeView)[] = [
        ...(connectedForges ?? []),
        ...(disconnectedForges ?? [])
    ];

    // NOTE: Until the user picks one: the url of an unknown forge, or no forge to pick from.
    const mode: Mode =
        fieldState.mode_selected ??
        ((value.url !== "" && value.forgeId === "") ||
        (connectedForges !== undefined && selectableForges.length === 0)
            ? "url"
            : "forges");

    const forgeId = (() => {
        const { forgeId_selected } = fieldState;

        if (
            forgeId_selected !== undefined &&
            selectableForges.some(({ forgeId }) => forgeId === forgeId_selected)
        ) {
            return forgeId_selected;
        }

        // NOTE: The forge of the repository, to be fixed first.
        if (forgesToFix.some(({ forgeId }) => forgeId === value.forgeId)) {
            return value.forgeId;
        }

        // NOTE: The first one, once the forges are known, when nothing is picked yet.
        return connectedForges?.[0]?.forgeId ?? disconnectedForges?.[0]?.forgeId;
    })();

    /** The selected forge can't list its repositories until it is connected */
    const forge_disconnected = disconnectedForges?.find(
        forge => forge.forgeId === forgeId
    );

    /** The search input, instead of the picked repository */
    const isRepositoryPickerVisible =
        mode === "forges" && forgeId !== undefined && value.url === "";

    const isRepositoryListVisible =
        isRepositoryPickerVisible && forge_disconnected === undefined;

    const username_forge = connectedForges?.find(
        forge => forge.forgeId === forgeId
    )?.username;

    const cacheKey =
        forgeId === undefined
            ? undefined
            : getRepositorySearchCacheKey({ forgeId, username: username_forge });

    const cache =
        cacheKey === undefined ? undefined : repositorySearchCacheByKey[cacheKey];

    const isSearchNeeded = getIsRepositorySearchNeeded({ cache, search });

    // NOTE: What is known right away, what the forge answers is added to it afterward.
    const repositories = getRepositorySearchMatches({ cache, search });

    const nextPage = getRepositorySearchNextPage({ cache, search });

    const page_toFetch: number | undefined = (() => {
        if (isSearchNeeded) {
            return 1;
        }

        const { moreRequest } = fieldState;

        if (
            moreRequest !== undefined &&
            moreRequest.forgeId === forgeId &&
            moreRequest.search === search &&
            moreRequest.page === nextPage
        ) {
            return moreRequest.page;
        }

        return undefined;
    })();

    const isSearchFailed =
        fieldState.failedSearch?.forgeId === forgeId &&
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
            forgeId === undefined ||
            cacheKey === undefined ||
            page_toFetch === undefined
        ) {
            return undefined;
        }

        const request: RepositoriesRequest = {
            forgeId,
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

    // NOTE: e.g. a launch saved while connected to a forge the user since signed out of.
    const isForgeNotConnected =
        value.forgeId !== "" &&
        connectedForges !== undefined &&
        !connectedForges.some(({ forgeId }) => forgeId === value.forgeId);

    // NOTE: The forge of the repository, not the one selected for the next search.
    const forgeId_repository =
        value.url === ""
            ? undefined
            : value.forgeId !== ""
              ? value.forgeId
              : getForgeIdOfRepositoryUrl({
                    forges: connectedForges ?? [],
                    url: value.url
                });

    const branchesRequest = (() => {
        if (forgeId_repository === undefined || isReadonly || isForgeNotConnected) {
            return undefined;
        }

        const request: BranchesRequest = {
            forgeId: forgeId_repository,
            repositoryUrl: value.url,
            search: fieldState.branchSearch
        };

        return {
            key: JSON.stringify([
                request,
                // NOTE: Listed again as another account.
                connectedForges?.find(({ forgeId }) => forgeId === forgeId_repository)
                    ?.username
            ]),
            request
        };
    })();

    const isUrlOnConnectedForge =
        value.url !== "" &&
        connectedForges?.some(({ forgeId }) => forgeId === forgeId_repository) === true;

    const forgesToOffer = (() => {
        const forges = disconnectedForges?.filter(forge => !forgesToFix.includes(forge));

        const isNoForgeConnected = connectedForges?.length === 0;

        if (
            isReadonly ||
            forges === undefined ||
            forges.length === 0 ||
            mode !== "url" ||
            !(isNoForgeConnected || forges.some(({ isSigningIn }) => isSigningIn))
        ) {
            return undefined;
        }

        return { forges, isNoForgeConnected };
    })();

    const forgePicker = ((): FieldView["forgePicker"] => {
        if (connectedForges !== undefined && selectableForges.length === 0) {
            return {
                status: disconnectedForges?.length !== 0 ? "nothing to pick" : "none"
            };
        }

        const isRepositoryPicked = !isRepositoryPickerVisible && value.url !== "";

        // NOTE: "" when the current repository isn't on a selectable forge.
        const forgeId_select =
            isRepositoryPickerVisible || value.url === ""
                ? (forgeId ?? "")
                : (selectableForges.find(({ forgeId }) => forgeId === forgeId_repository)
                      ?.forgeId ?? "");

        return {
            status: connectedForges === undefined ? "loading" : "ready",
            forges: selectableForges,
            forgeId: forgeId_select,
            unknownRepository:
                forgeId_select === "" && value.url !== ""
                    ? { host: getRepositoryHost(value.url), isForgeNotConnected }
                    : undefined,
            searchInputText: isRepositoryPicked ? getRepositoryPath(value.url) : search,
            isRepositoryPicked,
            isSearching,
            forgeToConnect: isRepositoryPickerVisible ? forge_disconnected : undefined,
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
                : isForgeNotConnected &&
                    !forgesToFix.some(({ forgeId }) => forgeId === value.forgeId)
                  ? "forge not connected"
                  : undefined,
        forgesToFix,
        forgesToOffer,
        forgePicker,
        urlInput: {
            text: fieldState.urlInput,
            hasCredentials: getHasUrlCredentials(fieldState.urlInput.trim()),
            isAnonymous:
                value.url !== "" && !isForgeNotConnected && !isUrlOnConnectedForge
        },
        branch: {
            isDisabled: isReadonly || value.url === "",
            isRepositoryMissing: value.url === "",
            branches:
                fieldState.branches.status === "loaded"
                    ? fieldState.branches.branches
                    : [],
            isLoading: fieldState.branches.status === "loading",
            isNoSuggestion: value.url !== "" && forgeId_repository === undefined
        }
    };

    return { view, forgeId, nextPage, repositoriesRequest, branchesRequest };
}

/**
 * The value written when the url input changes. undefined: the value stays. Not
 * written until it looks like a clone url, a host and a path, never with credentials
 * in it: the helm values end up in shared launch urls.
 */
export function getValueOfUrlInput(params: {
    urlInput: string;
    value: Value;
    /** Connected ones first */
    forges: { forgeId: string; url: string }[];
}): Value | undefined {
    const { value, forges } = params;

    const url = params.urlInput.trim();

    if (!getIsRepositoryUrl(url)) {
        return value.url === "" ? undefined : emptyValue;
    }

    if (url === value.url) {
        return undefined;
    }

    return {
        forgeId: getForgeIdOfRepositoryUrl({ forges, url }) ?? "",
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
