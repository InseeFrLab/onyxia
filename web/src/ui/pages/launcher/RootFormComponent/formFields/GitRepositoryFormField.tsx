import { Fragment, memo, useEffect, useId, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Link } from "@mui/material";
import { useResolveThemedAssetUrl } from "onyxia-ui";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { useCoreState, getCoreSync } from "core";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProvider } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitProvider";
import {
    getIsRepositorySearchNeeded,
    getRepositorySearchMatches,
    updateRepositorySearchCache,
    getRepositorySearchNextPage,
    type RepositorySearchCache
} from "core/usecases/gitProvidersManagement/decoupledLogic/repositorySearch";
import { defaultGitProviderLogoUrlByType } from "ui/pages/account/AccountGitTab/defaultGitProviderLogoUrlByType";
import {
    CardErrorMessage,
    GitProviderCard
} from "ui/pages/account/AccountGitTab/GitProviderCard";
import { ManageGitProviderDialog } from "ui/pages/account/AccountGitTab/AddGitProviderDialog";
import { ConfirmGitProviderRemovalDialog } from "ui/pages/account/AccountGitTab/ConfirmGitProviderRemovalDialog";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { getFieldStyle } from "ui/shared/fieldStyle";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";

type Value = FormField.GitRepository["value"];

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    isReadonly: boolean;
    onRemove: (() => void) | undefined;
    value: Value;
    onChange: (value: Value) => void;
    /** undefined while the Git providers are loading */
    connectedProviders: ConnectedProvider[] | undefined;
    /** undefined while the Git providers are loading */
    disconnectedProviders: DisconnectedProvider[] | undefined;
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: (params: { providerId: string }) => void;
    /** Opens the dialog where its token (and, added by the user, the rest) is edited */
    onManage: (params: { providerId: string }) => void;
    searchRepositories: (params: {
        providerId: string;
        search: string;
        /** 1, then the next ones when the user asks for more */
        page: number;
        signal: AbortSignal;
    }) => Promise<{ repositories: GitRepository[]; hasNextPage: boolean }>;
    listBranches: (params: {
        providerId: string;
        repositoryUrl: string;
        search: string;
        signal: AbortSignal;
    }) => Promise<string[]>;
    getConnectedProviderIdOfRepositoryUrl: (params: {
        url: string;
    }) => string | undefined;
    accountGitHref: string;
};

/**
 * "providers": the repository is picked among the ones of a connected provider.
 * "url": the clone url is typed, the provider is deduced from it (none: anonymous clone).
 */
type Mode = "providers" | "url";

const SEARCH_DEBOUNCE_MS = 300;
/** The repositories shown at once, the others are scrolled to */
const REPOSITORIES_VISIBLE_MAX = 5;
const REPOSITORY_ROW_HEIGHT_PX = 36;
/** Figma's Modal/ModelList: the branches shown at once, the others are scrolled to */
const BRANCHES_VISIBLE_MAX = 5;
const BRANCH_ROW_HEIGHT_PX = 32;

const emptyValue: Value = { providerId: "", url: "", branch: "" };

/**
 * A repository picked on a connected provider, or typed as a url, then a branch.
 * The repository is only written to the helm values once picked or a complete url typed.
 */
export const GitRepositoryFormField = memo((props: Props) => {
    const {
        className,
        title,
        description,
        isReadonly,
        onRemove,
        value,
        onChange,
        connectedProviders,
        disconnectedProviders,
        onSignIn,
        onManage,
        searchRepositories,
        listBranches,
        getConnectedProviderIdOfRepositoryUrl,
        accountGitHref
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();
    const providerSelectId = useId();
    const searchInputId = useId();
    const urlInputId = useId();
    const branchInputId = useId();

    const getLogoUrl = (provider: ConnectedProvider | DisconnectedProvider) =>
        provider.logoUrl !== undefined
            ? resolveThemedAssetUrl(provider.logoUrl)
            : defaultGitProviderLogoUrlByType[provider.type];

    const [mode_selected, setMode_selected] = useState<Mode | undefined>(undefined);

    // NOTE: What stopped working or what this repository needs, whatever the mode.
    const providers_toFix = disconnectedProviders?.filter(
        provider =>
            provider.issue !== "not connected" ||
            provider.error !== undefined ||
            provider.providerId === value.providerId
    );

    /**
     * In the Git profile select: the connected ones, then the others. One that isn't
     * connected says what to do in the select and above its repositories.
     */
    const selectableProviders: (ConnectedProvider | DisconnectedProvider)[] = [
        ...(connectedProviders ?? []),
        ...(disconnectedProviders ?? [])
    ];

    // NOTE: Until the user picks one: the url of an unknown provider, or no provider to pick from.
    const mode: Mode =
        mode_selected ??
        ((value.url !== "" && value.providerId === "") ||
        (connectedProviders !== undefined && selectableProviders.length === 0)
            ? "url"
            : "providers");

    const [providerId_selected, setProviderId_selected] = useState<string | undefined>(
        value.providerId === "" ? undefined : value.providerId
    );

    const providerId = (() => {
        if (
            providerId_selected !== undefined &&
            selectableProviders.some(
                ({ providerId }) => providerId === providerId_selected
            )
        ) {
            return providerId_selected;
        }

        // NOTE: The provider of the repository, to be fixed first.
        if (providers_toFix?.some(({ providerId }) => providerId === value.providerId)) {
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

    const [search, setSearch] = useState("");
    const [cacheByProviderId, setCacheByProviderId] = useState<
        Record<string, RepositorySearchCache | undefined>
    >({});
    const [failedSearch, setFailedSearch] = useState<
        { providerId: string; search: string } | undefined
    >(undefined);

    const cache = providerId === undefined ? undefined : cacheByProviderId[providerId];
    const isSearchNeeded = getIsRepositorySearchNeeded({ cache, search });

    // NOTE: What is known right away, what the provider answers is added to it afterward.
    const repositories = getRepositorySearchMatches({ cache, search });

    const nextPage = getRepositorySearchNextPage({ cache, search });

    /** The user asked for more matches of this search */
    const [moreRequest, setMoreRequest] = useState<
        { providerId: string; search: string; page: number } | undefined
    >(undefined);

    const page_toFetch: number | undefined = (() => {
        if (isSearchNeeded) {
            return 1;
        }

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
        failedSearch?.providerId === providerId && failedSearch?.search === search;
    const isSearching =
        isRepositoryListVisible &&
        !isReadonly &&
        page_toFetch !== undefined &&
        !isSearchFailed;

    useEffect(() => {
        if (
            providerId === undefined ||
            !isRepositoryListVisible ||
            isReadonly ||
            page_toFetch === undefined
        ) {
            return;
        }

        const abortController = new AbortController();

        setFailedSearch(undefined);

        const timer = setTimeout(
            () => {
                searchRepositories({
                    providerId,
                    search,
                    page: page_toFetch,
                    signal: abortController.signal
                }).then(
                    ({ repositories, hasNextPage }) =>
                        setCacheByProviderId(cacheByProviderId => ({
                            ...cacheByProviderId,
                            [providerId]: updateRepositorySearchCache({
                                cache: cacheByProviderId[providerId],
                                search,
                                page: page_toFetch,
                                repositories,
                                hasNextPage
                            })
                        })),
                    () => {
                        if (!abortController.signal.aborted) {
                            setFailedSearch({ providerId, search });
                        }
                    }
                );
            },
            // NOTE: Nothing being typed yet, or more asked for.
            search === "" || page_toFetch !== 1 ? 0 : SEARCH_DEBOUNCE_MS
        );

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [
        providerId,
        search,
        isRepositoryListVisible,
        isReadonly,
        page_toFetch,
        // NOTE: Asked again after a failure.
        moreRequest
    ]);

    const [urlInput, setUrlInput] = useState(value.url);

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
              : getConnectedProviderIdOfRepositoryUrl({ url: value.url });

    const [branchSearch, setBranchSearch] = useState("");
    const [branchesState, setBranchesState] = useState<
        | { status: "idle" }
        | { status: "loading" }
        | { status: "loaded"; branches: string[] }
    >({ status: "idle" });
    useEffect(() => {
        if (providerId_repository === undefined || isReadonly || isProviderNotConnected) {
            setBranchesState({ status: "idle" });
            return;
        }

        const abortController = new AbortController();

        setBranchesState({ status: "loading" });

        const timer = setTimeout(() => {
            listBranches({
                providerId: providerId_repository,
                repositoryUrl: value.url,
                search: branchSearch,
                signal: abortController.signal
            }).then(
                branches => setBranchesState({ status: "loaded", branches }),
                // NOTE: The branch can still be typed.
                () => {
                    if (!abortController.signal.aborted) {
                        setBranchesState({ status: "loaded", branches: [] });
                    }
                }
            );
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [
        providerId_repository,
        value.url,
        branchSearch,
        isReadonly,
        // NOTE: Listed again once signed in from the field.
        isProviderNotConnected
    ]);

    const branches = branchesState.status === "loaded" ? branchesState.branches : [];

    const onUrlInputChange = (url: string) => {
        setUrlInput(url);
        // NOTE: Otherwise derived from the value, emptied while the url is invalid.
        setMode_selected("url");

        const url_trimmed = url.trim();

        // NOTE: Not written until it looks like a clone url, a host and a path. Never
        // with credentials in it: the helm values end up in shared launch urls.
        if (
            !/^https?:\/\/[^/\s]+\/\S+/.test(url_trimmed) ||
            getHasUrlCredentials(url_trimmed)
        ) {
            if (value.url !== "") {
                onChange(emptyValue);
            }
            return;
        }

        if (url_trimmed === value.url) {
            return;
        }

        const providerId_ofUrl = getConnectedProviderIdOfRepositoryUrl({
            url: url_trimmed
        });

        if (providerId_ofUrl !== undefined) {
            setProviderId_selected(providerId_ofUrl);
        }

        onChange({
            providerId: providerId_ofUrl ?? "",
            url: url_trimmed,
            branch: ""
        });
    };

    const onSearchChange = (search: string) => {
        // NOTE: A pasted url, the repository may not be on a connected provider.
        if (/^https?:\/\//.test(search.trim())) {
            setSearch("");
            setMode_selected("url");
            onUrlInputChange(search);
            return;
        }

        setSearch(search);
    };

    const onModeChange = (mode: Mode) => {
        setMode_selected(mode);

        if (mode === "url") {
            setUrlInput(value.url);
        }
    };

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isSearchFocusRequested, setIsSearchFocusRequested] = useState(false);

    // NOTE: Once cleared, the search input is back: the user types the next one.
    useEffect(() => {
        if (isSearchFocusRequested) {
            searchInputRef.current?.focus();
            setIsSearchFocusRequested(false);
        }
    }, [isSearchFocusRequested]);

    const onRepositoryCleared = () => {
        setSearch("");
        onChange(emptyValue);
        setIsSearchFocusRequested(true);
    };

    const isRepositoryPicked = !isRepositoryPickerVisible && value.url !== "";

    const onRepositoryEdited = (search: string) => {
        onChange(emptyValue);
        onSearchChange(search);
    };

    const onRepositoryPicked = (repository: GitRepository) => {
        if (providerId === undefined) {
            return;
        }

        setSearch("");

        onChange({
            providerId,
            url: repository.httpCloneUrl,
            branch: repository.defaultBranch ?? ""
        });
    };

    const provider_repository =
        value.url === ""
            ? undefined
            : selectableProviders.find(
                  ({ providerId }) => providerId === providerId_repository
              );

    const isUrlOnConnectedProvider =
        value.url !== "" &&
        connectedProviders?.some(
            ({ providerId }) => providerId === providerId_repository
        ) === true;

    // NOTE: "" when the current repository isn't on a selectable provider, see renderValue.
    const providerId_select =
        isRepositoryPickerVisible || value.url === ""
            ? (providerId ?? "")
            : (provider_repository?.providerId ?? "");

    const getProviderChip = (
        provider: ConnectedProvider | DisconnectedProvider
    ): ProviderChip => {
        if (!("issue" in provider)) {
            return { label: t_card("chip connected"), severity: "success" };
        }

        switch (getDisconnectedProviderState(provider)) {
            case "to connect":
                return {
                    label: t_card(
                        provider.connectionMethod === "oauth"
                            ? "chip sign in required"
                            : "chip connection required"
                    ),
                    severity: "neutral"
                };
            case "session expired":
                return { label: t_card("chip reconnect required"), severity: "warning" };
            case "failed":
                return { label: t_card("chip connection error"), severity: "error" };
        }
    };

    const providers_toOffer = disconnectedProviders?.filter(
        provider => !providers_toFix?.includes(provider)
    );

    const isNoProviderConnected = connectedProviders?.length === 0;

    const isProvidersToOfferVisible =
        !isReadonly &&
        providers_toOffer !== undefined &&
        providers_toOffer.length !== 0 &&
        mode === "url" &&
        (isNoProviderConnected ||
            providers_toOffer.some(({ isSigningIn }) => isSigningIn));

    const repositoriesHeading = t(
        search === "" ? "recent repositories" : "matching repositories"
    );

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={
                isSearchFailed && isRepositoryListVisible
                    ? t("search failed")
                    : isProviderNotConnected &&
                        !providers_toFix?.some(
                            ({ providerId }) => providerId === value.providerId
                        )
                      ? t("provider not connected")
                      : undefined
            }
            onResetToDefault={undefined}
            inputId={mode === "providers" ? searchInputId : urlInputId}
            onRemove={onRemove}
            // NOTE: Its notices are shown above the repositories, the rare
            // errors left needn't keep an empty line under every repository.
            isErrorSpaceReserved={false}
            headerActions={
                <ToggleButtonGroup
                    className={classes.modes}
                    exclusive={true}
                    value={mode}
                    disabled={isReadonly}
                    onChange={(_event, mode: Mode | null) => {
                        // NOTE: null when clicking the selected one.
                        if (mode !== null) {
                            onModeChange(mode);
                        }
                    }}
                >
                    <ToggleButton value="providers" className={classes.mode}>
                        {t("mode providers")}
                    </ToggleButton>
                    <ToggleButton value="url" className={classes.mode}>
                        {t("mode url")}
                    </ToggleButton>
                </ToggleButtonGroup>
            }
        >
            <div className={classes.root}>
                {mode === "url" &&
                    providers_toFix?.map(provider => (
                        <ProviderToFix
                            key={provider.providerId}
                            provider={provider}
                            logoUrl={getLogoUrl(provider)}
                            isReadonly={isReadonly}
                            accountGitHref={accountGitHref}
                            onSignIn={onSignIn}
                            onManage={onManage}
                        />
                    ))}
                {isProvidersToOfferVisible && (
                    <div className={classes.providersToOffer}>
                        <Text typo="body 2" color="secondary">
                            {t(
                                isNoProviderConnected
                                    ? "connect a provider to use your repositories"
                                    : "connect another provider"
                            )}
                        </Text>
                        {providers_toOffer.map(provider => (
                            <ProviderToOffer
                                key={provider.providerId}
                                provider={provider}
                                logoUrl={getLogoUrl(provider)}
                                onSignIn={onSignIn}
                                onManage={onManage}
                            />
                        ))}
                    </div>
                )}
                {mode === "providers" &&
                    (connectedProviders !== undefined &&
                    selectableProviders.length === 0 ? (
                        // NOTE: Otherwise what to connect is listed above, or needs fixing.
                        disconnectedProviders?.length !== 0 ? null : (
                            <div className={classes.notice}>
                                <Icon
                                    className={classes.noticeIcon}
                                    icon={getIconUrlByName("Info")}
                                    size="small"
                                />
                                <Text typo="body 2">
                                    {t("no provider connected")}{" "}
                                    <Link href={accountGitHref} underline="hover">
                                        {t("connect a provider")}
                                    </Link>
                                </Text>
                            </div>
                        )
                    ) : (
                        <div className={classes.section}>
                            <div className={classes.row}>
                                <div className={cx(classes.field, classes.provider)}>
                                    <FieldLabel htmlFor={providerSelectId}>
                                        {t("git profile")}
                                    </FieldLabel>
                                    <Select
                                        id={providerSelectId}
                                        className={classes.providerSelect}
                                        input={
                                            <Input
                                                disableUnderline={true}
                                                className={classes.filledInput}
                                            />
                                        }
                                        value={providerId_select}
                                        displayEmpty={true}
                                        onChange={event => {
                                            setProviderId_selected(event.target.value);
                                            setSearch("");
                                            // NOTE: The repository picked on the previous
                                            // profile would otherwise be launched.
                                            if (
                                                value.url !== "" &&
                                                event.target.value !== value.providerId
                                            ) {
                                                onChange(emptyValue);
                                            }
                                        }}
                                        disabled={
                                            isReadonly || connectedProviders === undefined
                                        }
                                        MenuProps={{
                                            // NOTE: Under the field, not over it on the selected one.
                                            anchorOrigin: {
                                                vertical: "bottom",
                                                horizontal: "left"
                                            },
                                            transformOrigin: {
                                                vertical: "top",
                                                horizontal: "left"
                                            },
                                            slotProps: {
                                                paper: {
                                                    className: classes.providerMenu
                                                }
                                            }
                                        }}
                                        renderValue={providerId => {
                                            const provider = selectableProviders.find(
                                                provider =>
                                                    provider.providerId === providerId
                                            );

                                            if (provider === undefined) {
                                                return value.url === "" ? null : (
                                                    <span
                                                        className={classes.providerLabel}
                                                    >
                                                        <Icon
                                                            className={
                                                                classes.repositoryIcon
                                                            }
                                                            icon={getIconUrlByName(
                                                                isProviderNotConnected
                                                                    ? "ErrorOutline"
                                                                    : "Public"
                                                            )}
                                                            size="extra small"
                                                        />
                                                        <span
                                                            className={classes.ellipsis}
                                                        >
                                                            {getRepositoryHost(value.url)}
                                                        </span>
                                                    </span>
                                                );
                                            }

                                            return (
                                                <ProviderLabel
                                                    logoUrl={getLogoUrl(provider)}
                                                    displayName={provider.displayName}
                                                    chip={getProviderChip(provider)}
                                                />
                                            );
                                        }}
                                    >
                                        {selectableProviders.map(provider => (
                                            <MenuItem
                                                key={provider.providerId}
                                                value={provider.providerId}
                                                className={classes.providerMenuItem}
                                            >
                                                <ProviderMenuItemContent
                                                    provider={provider}
                                                    logoUrl={getLogoUrl(provider)}
                                                    chip={getProviderChip(provider)}
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </div>
                                {/* NOTE: One input, searching or showing the picked
                                repository: editing the picked one starts a new search. */}
                                <div
                                    className={cx(classes.field, classes.repositoryField)}
                                >
                                    <FieldLabel htmlFor={searchInputId}>
                                        {t("search")}
                                    </FieldLabel>
                                    <Input
                                        id={searchInputId}
                                        className={classes.filledInput}
                                        disableUnderline={true}
                                        fullWidth={true}
                                        disabled={isReadonly}
                                        inputRef={searchInputRef}
                                        value={
                                            isRepositoryPicked
                                                ? getRepositoryPath(value.url)
                                                : search
                                        }
                                        onChange={event =>
                                            isRepositoryPicked
                                                ? onRepositoryEdited(event.target.value)
                                                : onSearchChange(event.target.value)
                                        }
                                        placeholder={t("repository placeholder")}
                                        endAdornment={
                                            isSearching ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                isRepositoryPicked &&
                                                !isReadonly && (
                                                    <IconButton
                                                        size="small"
                                                        icon={getIconUrlByName("Cancel")}
                                                        aria-label={t("clear repository")}
                                                        onClick={onRepositoryCleared}
                                                    />
                                                )
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            {isRepositoryPickerVisible &&
                                provider_disconnected !== undefined && (
                                    <>
                                        <ProviderNotice
                                            provider={provider_disconnected}
                                            isReadonly={isReadonly}
                                            accountGitHref={accountGitHref}
                                            onSignIn={onSignIn}
                                            onManage={onManage}
                                        />
                                        <div className={classes.repositoriesUnavailable}>
                                            <Text
                                                typo="label 1"
                                                className={
                                                    classes.repositoriesUnavailableTitle
                                                }
                                            >
                                                {t("repositories unavailable")}
                                            </Text>
                                            <Text typo="body 1">
                                                {t("repositories unavailable hint")}
                                            </Text>
                                        </div>
                                    </>
                                )}
                            {isRepositoryListVisible && (
                                <div className={classes.repositoriesWrapper}>
                                    <ul
                                        className={classes.repositories}
                                        aria-label={repositoriesHeading}
                                        aria-busy={isSearching}
                                    >
                                        {isSearching &&
                                            repositories.length === 0 &&
                                            // NOTE: Only when there is nothing to show yet.
                                            [0, 1, 2].map(i => (
                                                <li
                                                    key={i}
                                                    className={classes.repositoryRow}
                                                >
                                                    <Skeleton width="40%" />
                                                </li>
                                            ))}
                                        {cache !== undefined &&
                                            !isSearching &&
                                            !isSearchFailed &&
                                            repositories.length === 0 && (
                                                <li className={classes.repositoriesEmpty}>
                                                    <Text typo="body 2" color="secondary">
                                                        {t("no repository found")}
                                                    </Text>
                                                </li>
                                            )}
                                        {repositories.map(repository => (
                                            <li key={repository.id}>
                                                <ButtonBase
                                                    className={cx(
                                                        classes.repositoryRow,
                                                        classes.repositoryButton,
                                                        repository.httpCloneUrl ===
                                                            value.url &&
                                                            classes.repositoryButton_selected
                                                    )}
                                                    disabled={isReadonly}
                                                    onClick={() =>
                                                        onRepositoryPicked(repository)
                                                    }
                                                >
                                                    <Icon
                                                        className={classes.repositoryIcon}
                                                        icon={getIconUrlByName(
                                                            "AccountTreeOutlined"
                                                        )}
                                                        size="extra small"
                                                    />
                                                    <RepositoryPath
                                                        fullPath={repository.fullPath}
                                                    />
                                                </ButtonBase>
                                            </li>
                                        ))}
                                        {providerId !== undefined &&
                                            nextPage !== undefined &&
                                            repositories.length !== 0 && (
                                                <li>
                                                    <ButtonBase
                                                        className={cx(
                                                            classes.repositoryRow,
                                                            classes.repositoryButton,
                                                            classes.moreRepositories
                                                        )}
                                                        disabled={
                                                            isReadonly || isSearching
                                                        }
                                                        onClick={() => {
                                                            setFailedSearch(undefined);
                                                            setMoreRequest({
                                                                providerId,
                                                                search,
                                                                page: nextPage
                                                            });
                                                        }}
                                                    >
                                                        {isSearching ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <Text typo="body 2">
                                                                {t("more repositories")}
                                                            </Text>
                                                        )}
                                                    </ButtonBase>
                                                </li>
                                            )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                {mode === "url" && (
                    <div className={classes.section}>
                        <div className={classes.field}>
                            <FieldLabel htmlFor={urlInputId}>
                                {t("repository url")}
                            </FieldLabel>
                            <Input
                                id={urlInputId}
                                className={classes.filledInput}
                                disableUnderline={true}
                                fullWidth={true}
                                disabled={isReadonly}
                                value={urlInput}
                                onChange={event => onUrlInputChange(event.target.value)}
                                placeholder="https://github.com/owner/repository.git"
                            />
                        </div>
                        {getHasUrlCredentials(urlInput.trim()) && (
                            <Text typo="caption" className={classes.urlError}>
                                {t("url with credentials")}
                            </Text>
                        )}
                        {/* NOTE: Every connected provider's credentials are given to the
                        service: only a url on none of them needs telling. */}
                        {value.url !== "" &&
                            !isProviderNotConnected &&
                            !isUrlOnConnectedProvider && (
                                <div className={classes.detection}>
                                    <Icon
                                        className={classes.adornment}
                                        icon={getIconUrlByName("Public")}
                                        size="extra small"
                                    />
                                    <Text typo="caption" color="secondary">
                                        {t("url anonymous")}
                                    </Text>
                                </div>
                            )}
                    </div>
                )}
                <div className={classes.section}>
                    <div className={classes.branchRow}>
                        <div
                            className={cx(
                                classes.field,
                                classes.branch,
                                value.url === "" && classes.branch_disabled
                            )}
                        >
                            <FieldLabel htmlFor={branchInputId}>{t("branch")}</FieldLabel>
                            <Autocomplete<string, false, false, true>
                                freeSolo={true}
                                disabled={isReadonly || value.url === ""}
                                options={branches}
                                // NOTE: The provider already filters on the search.
                                filterOptions={options => options}
                                loading={branchesState.status === "loading"}
                                // NOTE: The branch is marked in the list when it is one of them.
                                value={value.branch === "" ? null : value.branch}
                                onChange={(_event, branch) =>
                                    onChange({ ...value, branch: branch ?? "" })
                                }
                                inputValue={value.branch}
                                onInputChange={(_event, inputValue, reason) => {
                                    if (reason === "input") {
                                        setBranchSearch(inputValue);
                                    }

                                    if (inputValue !== value.branch) {
                                        onChange({ ...value, branch: inputValue });
                                    }
                                }}
                                // NOTE: Every branch when opened, the search only once typing.
                                onOpen={() => setBranchSearch("")}
                                openOnFocus={true}
                                noOptionsText={t("no branch found")}
                                slotProps={{ paper: { className: classes.branchMenu } }}
                                renderInput={params => (
                                    // NOTE: Like a select: a click anywhere opens the list.
                                    <div
                                        ref={params.InputProps.ref}
                                        onMouseDown={params.InputProps.onMouseDown}
                                    >
                                        <Input
                                            inputProps={params.inputProps}
                                            id={branchInputId}
                                            className={classes.filledInput}
                                            disableUnderline={true}
                                            fullWidth={true}
                                            placeholder={t("select a branch")}
                                            endAdornment={
                                                branchesState.status === "loading" ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    <Icon
                                                        className={classes.branchArrow}
                                                        icon={getIconUrlByName(
                                                            "ArrowDropDown"
                                                        )}
                                                        size="default"
                                                    />
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            />
                            <Text typo="body 2" className={classes.helperText}>
                                {t("optional")}
                            </Text>
                        </div>
                    </div>
                    {value.url !== "" && providerId_repository === undefined && (
                        <Text typo="caption" color="secondary">
                            {t("no branch suggestion")}
                        </Text>
                    )}
                </div>
            </div>
        </FormFieldWrapper>
    );
});

/** What stopped working (or what the repository needs), and how to fix it */
function ProviderToFix(props: {
    provider: DisconnectedProvider;
    logoUrl: string;
    isReadonly: boolean;
    accountGitHref: string;
    onSignIn: (params: { providerId: string }) => void;
    onManage: (params: { providerId: string }) => void;
}) {
    const { provider, logoUrl, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });

    const { displayName, issue, error } = provider;

    return (
        <div className={classes.providerToFix} role="alert">
            <Icon
                className={classes.providerToFixIcon}
                icon={getIconUrlByName("WarningAmber")}
                size="small"
            />
            <img className={classes.providerLogo} src={logoUrl} alt="" />
            <Text typo="body 2" className={classes.providerToFixMessage}>
                <span className={classes.name}>{displayName}</span>
                {" · "}
                {(() => {
                    if (error !== undefined) {
                        return (
                            <CardErrorMessage error={error} providerName={displayName} />
                        );
                    }

                    return issue === "not connected"
                        ? t("provider not connected")
                        : t_card(issue);
                })()}
            </Text>
            <ProviderToFixAction
                className={classes.providerToFixAction}
                provider={provider}
                isReadonly={isReadonly}
                accountGitHref={accountGitHref}
                onSignIn={onSignIn}
                onManage={onManage}
            />
        </div>
    );
}

/** Signing in again, the token in the manage dialog, or the account for a grant */
function ProviderToFixAction(props: {
    className?: string;
    provider: DisconnectedProvider;
    isReadonly: boolean;
    accountGitHref: string;
    onSignIn: (params: { providerId: string }) => void;
    onManage: (params: { providerId: string }) => void;
}) {
    const { className, provider, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });

    const { providerId, issue, error, connectionMethod, isSigningIn } = provider;

    // NOTE: Only the provider's settings get rid of a conflicting grant.
    if (error?.type === "grant scope conflict") {
        return (
            <Link className={className} href={accountGitHref} underline="hover">
                {t("fix in account")}
            </Link>
        );
    }

    if (connectionMethod === "personal-access-token") {
        return (
            <Button
                className={className}
                variant="secondary"
                disabled={isReadonly}
                onClick={() => onManage({ providerId })}
            >
                {t("manage")}
            </Button>
        );
    }

    return (
        <Button
            className={className}
            variant="secondary"
            disabled={isReadonly || isSigningIn}
            onClick={() => onSignIn({ providerId })}
        >
            {t_card(issue === "not connected" ? "sign in" : "sign in again")}
        </Button>
    );
}

/** One click for OAuth, the manage dialog for a personal access token */
function ProviderToOffer(props: {
    provider: DisconnectedProvider;
    logoUrl: string;
    onSignIn: (params: { providerId: string }) => void;
    onManage: (params: { providerId: string }) => void;
}) {
    const { provider, logoUrl, onSignIn, onManage } = props;

    const { classes } = useStyles();

    const { providerId, displayName, connectionMethod, isSigningIn } = provider;

    const children = (
        <>
            {isSigningIn ? (
                <CircularProgress size={16} />
            ) : (
                <img className={classes.providerLogo} src={logoUrl} alt="" />
            )}
            {displayName}
        </>
    );

    return (
        <ButtonBase
            className={classes.providerToOffer}
            disabled={isSigningIn}
            onClick={() =>
                connectionMethod === "oauth"
                    ? onSignIn({ providerId })
                    : onManage({ providerId })
            }
        >
            {children}
        </ButtonBase>
    );
}

/**
 * - "to connect": never connected, or signed out. Nothing went wrong.
 * - "session expired": was connected, signing in again restores it.
 * - "failed": the last attempt failed, or the provider refuses the token.
 */
function getDisconnectedProviderState(
    provider: DisconnectedProvider
): "to connect" | "session expired" | "failed" {
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

/**
 * What to do so that the provider lists its repositories: signing in with OAuth (a
 * provider of the region), the manage dialog for a token, or, for a grant only the
 * provider can revoke, the account.
 */
function getProviderAction(params: {
    provider: DisconnectedProvider;
    accountGitHref: string;
}):
    | { label: "sign in" | "reconnect" | "try again"; type: "sign in" }
    | { label: "manage"; type: "manage" }
    | { label: "open account"; type: "link"; href: string } {
    const { provider, accountGitHref } = params;

    if (provider.error?.type === "grant scope conflict") {
        return { label: "open account", type: "link", href: accountGitHref };
    }

    if (provider.connectionMethod === "personal-access-token") {
        return { label: "manage", type: "manage" };
    }

    switch (getDisconnectedProviderState(provider)) {
        case "to connect":
            return { label: "sign in", type: "sign in" };
        case "session expired":
            return { label: "reconnect", type: "sign in" };
        case "failed":
            return { label: "try again", type: "sign in" };
    }
}

/** Above the repositories of a provider that isn't connected: why, and what to do */
function ProviderNotice(props: {
    provider: DisconnectedProvider;
    isReadonly: boolean;
    accountGitHref: string;
    onSignIn: (params: { providerId: string }) => void;
    onManage: (params: { providerId: string }) => void;
}) {
    const { provider, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });

    const { providerId, displayName: providerName, error, issue } = provider;

    const providerAction = getProviderAction({ provider, accountGitHref });

    const action = {
        label: t(providerAction.label),
        isDisabled: isReadonly || provider.isSigningIn,
        ...(() => {
            switch (providerAction.type) {
                case "link":
                    return { href: providerAction.href };
                case "manage":
                    return { onClick: () => onManage({ providerId }) };
                case "sign in":
                    return { onClick: () => onSignIn({ providerId }) };
            }
        })()
    };

    switch (getDisconnectedProviderState(provider)) {
        case "to connect":
            return (
                <ErrorAlert
                    severity="info"
                    title={t("connect your account title")}
                    message={t(
                        provider.connectionMethod === "oauth"
                            ? "connect your account"
                            : "connect your account with a token"
                    )}
                    action={action}
                />
            );
        case "session expired":
            return (
                <ErrorAlert
                    severity="warning"
                    title={t("reconnect title", { providerName })}
                    message={t("session ended", { providerName })}
                    action={action}
                />
            );
        case "failed":
            return (
                <ErrorAlert
                    severity="error"
                    title={t("authentication failed")}
                    message={
                        error !== undefined ? (
                            <CardErrorMessage error={error} providerName={providerName} />
                        ) : (
                            t_card(issue === "not connected" ? "sign in failed" : issue)
                        )
                    }
                    action={action}
                />
            );
    }
}

/** A row of the Git profile select: who is connected, or what to do */
function ProviderMenuItemContent(props: {
    provider: ConnectedProvider | DisconnectedProvider;
    logoUrl: string;
    chip: ProviderChip;
}) {
    const { provider, logoUrl, chip } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });

    return (
        <span className={classes.providerMenuRow}>
            <img className={classes.providerMenuLogo} src={logoUrl} alt="" />
            <span className={classes.providerMenuText}>
                <span className={classes.providerMenuName}>{provider.displayName}</span>
                <span className={classes.providerMenuSubtitle}>
                    {"issue" in provider
                        ? t_card("not connected")
                        : t("connected as", { username: provider.username })}
                </span>
            </span>
            {"issue" in provider ? (
                // NOTE: What to do is shown under the field once the profile is picked.
                <Chip chip={chip} />
            ) : (
                <Icon
                    className={classes.providerMenuCheck}
                    icon={getIconUrlByName("Check")}
                    size="small"
                />
            )}
        </span>
    );
}

/** user:token@host: the helm values, so the token, would end up in shared launch urls */
function getHasUrlCredentials(url: string): boolean {
    try {
        const { username, password } = new URL(url);
        return username !== "" || password !== "";
    } catch {
        return false;
    }
}

function FieldLabel(props: { htmlFor: string; children: string }) {
    const { htmlFor, children } = props;

    return (
        <label htmlFor={htmlFor}>
            <Text typo="label 1" htmlComponent="span">
                {children}
            </Text>
        </label>
    );
}

type ProviderChip = {
    label: string;
    severity: "success" | "neutral" | "warning" | "error";
};

function Chip(props: { chip: ProviderChip }) {
    const { chip } = props;

    const { classes, cx } = useStyles();

    return (
        <span
            className={cx(
                classes.chip,
                chip.severity === "neutral" && classes.chip_neutral,
                chip.severity === "warning" && classes.chip_warning,
                chip.severity === "error" && classes.chip_error
            )}
        >
            <span
                className={cx(
                    classes.chipDot,
                    chip.severity === "neutral" && classes.chipDot_neutral,
                    chip.severity === "warning" && classes.chipDot_warning,
                    chip.severity === "error" && classes.chipDot_error
                )}
            />
            {chip.label}
        </span>
    );
}

function ProviderLabel(props: {
    logoUrl: string;
    displayName: string;
    /** undefined: no chip */
    chip?: ProviderChip;
}) {
    const { logoUrl, displayName, chip } = props;

    const { classes } = useStyles();

    return (
        <span className={classes.providerLabel}>
            <img className={classes.providerLogo} src={logoUrl} alt="" />
            <span className={classes.ellipsis}>{displayName}</span>
            {chip !== undefined && <Chip chip={chip} />}
        </span>
    );
}

/** e.g. "group/project" */
function RepositoryPath(props: { fullPath: string }) {
    const { fullPath } = props;

    const { classes } = useStyles();

    return (
        <Text typo="label 1" className={classes.ellipsis}>
            {fullPath}
        </Text>
    );
}

/** group/project of the clone url, the url itself when it doesn't look like one */
function getRepositoryPath(url: string): string {
    try {
        const path = new URL(url).pathname.replace(/^\/+/, "").replace(/\.git$/, "");

        return path === "" ? url : path;
    } catch {
        return url;
    }
}

/** The host of the clone url, the url itself when it doesn't look like one */
function getRepositoryHost(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

/** Reads the connected providers and searches the repositories in the core */
export function GitRepositoryFormFieldContainer(
    props: Omit<
        Props,
        | "connectedProviders"
        | "disconnectedProviders"
        | "onSignIn"
        | "onManage"
        | "searchRepositories"
        | "listBranches"
        | "getConnectedProviderIdOfRepositoryUrl"
        | "accountGitHref"
    >
) {
    const connectedProviders = useCoreState(
        "gitProvidersManagement",
        "connectedProviders"
    );

    const disconnectedProviders = useCoreState(
        "gitAccountUiController",
        "disconnectedProviders"
    );

    const manageProviderDialog = useCoreState(
        "gitAccountUiController",
        "manageProviderDialog"
    );

    const {
        functions: { gitProvidersManagement, gitAccountUiController, launcher }
    } = getCoreSync();

    const [providerToRemove, setProviderToRemove] = useState<
        { id: string; displayName: string } | undefined
    >(undefined);

    // NOTE: Not left open for the account page.
    useEffect(() => () => gitAccountUiController.closeManageProviderDialog(), []);

    return (
        <Fragment>
            <GitRepositoryFormField
                {...props}
                connectedProviders={connectedProviders}
                disconnectedProviders={disconnectedProviders}
                onSignIn={launcher.signInToGitProvider}
                onManage={gitAccountUiController.openManageProviderDialog}
                searchRepositories={gitProvidersManagement.listRepositories}
                listBranches={gitProvidersManagement.listBranches}
                getConnectedProviderIdOfRepositoryUrl={
                    gitProvidersManagement.getConnectedProviderIdOfRepositoryUrl
                }
                accountGitHref={routes.account({ tabId: "git" }).href}
            />
            {manageProviderDialog.isOpen && (
                <ManageGitProviderDialog
                    view={manageProviderDialog}
                    onProviderChange={providerId =>
                        gitAccountUiController.openManageProviderDialog({ providerId })
                    }
                    onClose={gitAccountUiController.closeManageProviderDialog}
                    onSubmit={launcher.saveGitProvider}
                    onDelete={() => {
                        const { card } = manageProviderDialog;

                        gitAccountUiController.closeManageProviderDialog();

                        if (card.isAddedByUser) {
                            // NOTE: Confirmed first, it is removed as a whole.
                            setProviderToRemove({
                                id: card.id,
                                displayName: card.displayName
                            });
                            return;
                        }

                        launcher.removeGitCredentials({
                            providerId: card.id,
                            isAddedByUser: false
                        });
                    }}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            <ConfirmGitProviderRemovalDialog
                providerName={providerToRemove?.displayName}
                onClose={({ doProceed }) => {
                    if (doProceed && providerToRemove !== undefined) {
                        launcher.removeGitCredentials({
                            providerId: providerToRemove.id,
                            isAddedByUser: true
                        });
                    }
                    setProviderToRemove(undefined);
                }}
            />
        </Fragment>
    );
}

const useStyles = tss.withName({ GitRepositoryFormField }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    modes: {
        flexShrink: 0,
        padding: theme.spacing(1),
        gap: theme.spacing(1),
        borderRadius: 12,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    mode: {
        ...theme.typography.variants["label 1"].style,
        textTransform: "none",
        padding: theme.spacing({ topBottom: 2, rightLeft: 4 }),
        border: "none",
        // NOTE: Overrides the grouped borders of MUI.
        "&&": {
            borderRadius: 8,
            margin: 0
        },
        color: theme.colors.useCases.typography.textPrimary,
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textPrimary,
            fontWeight: 600,
            boxShadow: "0px 6px 12px 0px rgba(34, 37, 47, 0.15)"
        }
    },
    notice: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3),
        padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
        borderRadius: 8,
        border: `1px solid ${theme.colors.useCases.surfaces.surface3}`
    },
    noticeIcon: {
        color: theme.colors.useCases.typography.textFocus,
        flexShrink: 0
    },
    providerToFix: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: theme.spacing({ topBottom: 2, rightLeft: 3 }),
        borderRadius: 8,
        border: `1px solid ${theme.colors.useCases.alertSeverity.warning.main}`,
        backgroundColor: theme.colors.useCases.alertSeverity.warning.background
    },
    providerToFixIcon: {
        color: theme.colors.useCases.alertSeverity.warning.main,
        flexShrink: 0
    },
    providerToFixMessage: {
        flex: "1 1 240px",
        minWidth: 0
    },
    providerToFixAction: {
        flexShrink: 0,
        marginLeft: "auto"
    },
    providersToOffer: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing(2)
    },
    providerToOffer: {
        ...theme.typography.variants["body 2"].style,
        gap: theme.spacing(2),
        padding: theme.spacing({ topBottom: 1, rightLeft: 3 }),
        borderRadius: 999,
        color: theme.colors.useCases.typography.textPrimary,
        border: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
        "&:hover, &.Mui-focusVisible": {
            color: theme.colors.useCases.typography.textFocus,
            borderColor: theme.colors.useCases.typography.textFocus,
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
        }
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    row: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: theme.spacing(2.5)
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        flex: 1,
        minWidth: 0
    },
    provider: {
        flex: "0 1 250px",
        minWidth: 200
    },
    repositoryField: {
        // NOTE: Below the provider rather than squeezed next to it.
        flex: "1 1 280px"
    },
    providerSelect: {
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center"
        }
    },
    providerLabel: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        minWidth: 0,
        width: "100%"
    },
    providerLogo: {
        width: 24,
        height: 24,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: "50%"
    },
    adornment: {
        color: theme.colors.useCases.typography.textSecondary,
        marginRight: theme.spacing(2),
        flexShrink: 0
    },
    name: {
        fontWeight: 500
    },
    ellipsis: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        flex: 1
    },
    repositoriesWrapper: {
        display: "flex",
        flexDirection: "column"
    },
    repositories: {
        listStyle: "none",
        margin: 0,
        padding: theme.spacing(2),
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        // NOTE: Exactly REPOSITORIES_VISIBLE_MAX rows: the list's padding, the rows,
        // and between two rows the gap, the separator and its padding.
        maxHeight:
            2 * theme.spacing(2) +
            REPOSITORIES_VISIBLE_MAX * REPOSITORY_ROW_HEIGHT_PX +
            (REPOSITORIES_VISIBLE_MAX - 1) * (2 * theme.spacing(1) + 1),
        boxSizing: "border-box",
        overflowY: "auto",
        borderRadius: 12,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        "& > li": {
            flexShrink: 0
        },
        "& > li + li": {
            paddingTop: theme.spacing(1),
            borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`
        }
    },
    repositoryRow: {
        boxSizing: "border-box",
        height: REPOSITORY_ROW_HEIGHT_PX,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        width: "100%",
        textAlign: "left",
        borderRadius: 8,
        padding: theme.spacing({ topBottom: 1, rightLeft: 2 })
    },
    repositoryButton: {
        "&:hover, &.Mui-focusVisible": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        }
    },
    moreRepositories: {
        justifyContent: "center",
        color: theme.colors.useCases.typography.textFocus
    },
    repositoryButton_selected: {
        "&, &:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
        }
    },
    repositoryIcon: {
        color: theme.colors.useCases.typography.textSecondary,
        flexShrink: 0
    },
    repositoriesEmpty: {
        padding: theme.spacing(4),
        textAlign: "center"
    },
    branch_disabled: {
        opacity: 0.3
    },
    filledInput: {
        ...theme.typography.variants["body 1"].style,
        height: 45,
        boxSizing: "border-box",
        padding: theme.spacing({ topBottom: 2, rightLeft: 2.5 }),
        borderRadius: 8,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        "& input::placeholder": {
            color: theme.colors.useCases.typography.textSecondary,
            opacity: 1
        },
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minWidth: 0
        },
        "& .MuiSelect-icon": {
            color: theme.colors.useCases.typography.textPrimary
        }
    },
    chip: {
        ...theme.typography.variants["caption"].style,
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        flexShrink: 0,
        padding: theme.spacing({ topBottom: 1, rightLeft: 2 }),
        borderRadius: 100,
        color: theme.colors.useCases.typography.textPrimary,
        backgroundColor: theme.colors.useCases.alertSeverity.success.background
    },
    // NOTE: Figma's surface-tertiary
    chip_neutral: {
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    chip_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.background
    },
    chip_error: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.background
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    chipDot_neutral: {
        backgroundColor: theme.colors.useCases.typography.textSecondary
    },
    chipDot_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.main
    },
    chipDot_error: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.main
    },
    providerMenu: {
        marginTop: theme.spacing(1),
        borderRadius: theme.spacing(4),
        boxShadow: theme.shadows[2],
        "& .MuiList-root": {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1),
            padding: theme.spacing(2)
        }
    },
    providerMenuItem: {
        padding: `${theme.spacing(2)}px ${theme.spacing(4)}px ${theme.spacing(2)}px ${theme.spacing(2)}px`,
        borderRadius: theme.spacing(3),
        ...getFieldStyle({ theme }).option
    },
    providerMenuRow: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3)
    },
    providerMenuLogo: {
        width: 32,
        height: 32,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: theme.spacing(2)
    },
    providerMenuText: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column"
    },
    providerMenuName: {
        ...theme.typography.variants["label 1"].style,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    providerMenuSubtitle: {
        ...theme.typography.variants["caption"].style,
        color: theme.colors.useCases.typography.textSecondary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    providerMenuCheck: {
        flexShrink: 0,
        color: theme.colors.useCases.alertSeverity.success.main
    },
    repositoriesUnavailable: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.spacing(1),
        padding: theme.spacing({ topBottom: 5, rightLeft: 2 }),
        textAlign: "center",
        borderRadius: 12,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    repositoriesUnavailableTitle: {
        fontWeight: 600
    },
    helperText: {
        color: theme.colors.useCases.typography.textTertiary
    },
    urlError: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    detection: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2)
    },
    branchRow: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        alignItems: "flex-end",
        columnGap: "10px",
        rowGap: theme.spacing(3)
    },
    branch: {
        minWidth: 0
    },
    branchArrow: {
        flexShrink: 0,
        pointerEvents: "none",
        color: theme.colors.useCases.typography.textPrimary
    },
    branchMenu: {
        marginTop: theme.spacing(1),
        borderRadius: theme.spacing(3),
        boxShadow: theme.shadows[2],
        // NOTE: "&&": above MUI's own rules, which the app injects after these.
        "&& .MuiAutocomplete-listbox": {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1),
            padding: theme.spacing(2),
            boxSizing: "border-box",
            // NOTE: Exactly BRANCHES_VISIBLE_MAX rows: the padding, the rows, the gaps.
            maxHeight:
                2 * theme.spacing(2) +
                BRANCHES_VISIBLE_MAX * BRANCH_ROW_HEIGHT_PX +
                (BRANCHES_VISIBLE_MAX - 1) * theme.spacing(1),
            overflowY: "auto"
        },
        "&& .MuiAutocomplete-option": {
            ...theme.typography.variants["label 1"].style,
            boxSizing: "border-box",
            flexShrink: 0,
            minHeight: "auto",
            height: BRANCH_ROW_HEIGHT_PX,
            padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
            borderRadius: theme.spacing(2),
            ...getFieldStyle({ theme }).option
        }
    }
}));

const { i18n } = declareComponentKeys<
    | "mode providers"
    | "mode url"
    | "git profile"
    | "search"
    | "repository placeholder"
    | "clear repository"
    | "repository url"
    | "url anonymous"
    | "url with credentials"
    | "more repositories"
    | "branch"
    | "select a branch"
    | "no branch found"
    | "no branch suggestion"
    | "recent repositories"
    | "matching repositories"
    | "no repository found"
    | "search failed"
    | "provider not connected"
    | "no provider connected"
    | "connect a provider"
    | "connect a provider to use your repositories"
    | "connect another provider"
    | "fix in account"
    | { K: "connected as"; P: { username: string } }
    | "sign in"
    | "reconnect"
    | "try again"
    | "open account"
    | "manage"
    | "connect your account title"
    | "connect your account"
    | "connect your account with a token"
    | { K: "reconnect title"; P: { providerName: string } }
    | { K: "session ended"; P: { providerName: string } }
    | "authentication failed"
    | "repositories unavailable"
    | "repositories unavailable hint"
    | "optional"
>()({ GitRepositoryFormField });
export type I18n = typeof i18n;
