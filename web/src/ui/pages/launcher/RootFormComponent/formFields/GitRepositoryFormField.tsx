import { memo, useEffect, useId, useState } from "react";
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
    type RepositorySearchCache
} from "core/usecases/gitProvidersManagement/decoupledLogic/repositorySearch";
import { defaultGitProviderLogoUrlByType } from "ui/pages/account/AccountGitTab/defaultGitProviderLogoUrlByType";
import {
    CardErrorMessage,
    GitProviderCard
} from "ui/pages/account/AccountGitTab/GitProviderCard";
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
    searchRepositories: (params: {
        providerId: string;
        search: string;
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
const BRANCH_SUGGESTIONS_MAX = 5;

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
        searchRepositories,
        listBranches,
        getConnectedProviderIdOfRepositoryUrl,
        accountGitHref
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
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

    /** In the Git provider select: the connected ones, then the ones to fix */
    const selectableProviders: (ConnectedProvider | DisconnectedProvider)[] = [
        ...(connectedProviders ?? []),
        ...(providers_toFix ?? [])
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
        return connectedProviders?.[0]?.providerId ?? providers_toFix?.[0]?.providerId;
    })();

    /** The selected provider can't list its repositories until it is fixed */
    const provider_toFix = providers_toFix?.find(
        provider => provider.providerId === providerId
    );

    const [isChangingRepository, setIsChangingRepository] = useState(false);

    /** The search input, instead of the picked repository */
    const isRepositoryPickerVisible =
        mode === "providers" &&
        providerId !== undefined &&
        (value.url === "" || isChangingRepository);

    const isRepositoryListVisible =
        isRepositoryPickerVisible && provider_toFix === undefined;

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

    const isSearchFailed =
        failedSearch?.providerId === providerId && failedSearch?.search === search;
    const isSearching =
        isRepositoryListVisible && !isReadonly && isSearchNeeded && !isSearchFailed;

    useEffect(() => {
        if (
            providerId === undefined ||
            !isRepositoryListVisible ||
            isReadonly ||
            !isSearchNeeded
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
                    signal: abortController.signal
                }).then(
                    ({ repositories, hasNextPage }) =>
                        setCacheByProviderId(cacheByProviderId => ({
                            ...cacheByProviderId,
                            [providerId]: updateRepositorySearchCache({
                                cache: cacheByProviderId[providerId],
                                search,
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
            // NOTE: Nothing being typed yet.
            search === "" ? 0 : SEARCH_DEBOUNCE_MS
        );

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [providerId, search, isRepositoryListVisible, isReadonly, isSearchNeeded]);

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
    /** The first branches of the repository, unaffected by the search */
    const [branchSuggestions, setBranchSuggestions] = useState<string[] | undefined>(
        undefined
    );

    useEffect(() => {
        setBranchSuggestions(undefined);
    }, [value.url]);

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
                branches => {
                    setBranchesState({ status: "loaded", branches });

                    if (branchSearch === "") {
                        setBranchSuggestions(branches.slice(0, BRANCH_SUGGESTIONS_MAX));
                    }
                },
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

        const url_trimmed = url.trim();

        // NOTE: Not written until it looks like a clone url, a host and a path.
        if (!/^https?:\/\/[^/\s]+\/\S+/.test(url_trimmed)) {
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

    const onRepositoryPicked = (repository: GitRepository) => {
        if (providerId === undefined) {
            return;
        }

        setIsChangingRepository(false);
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

    const providerDisplayName_ofUrl =
        value.url === ""
            ? undefined
            : connectedProviders?.find(
                  ({ providerId }) => providerId === providerId_repository
              )?.displayName;

    // NOTE: "" when the current repository isn't on a selectable provider, see renderValue.
    const providerId_select =
        isRepositoryPickerVisible || value.url === ""
            ? (providerId ?? "")
            : (provider_repository?.providerId ?? "");

    const getProviderChip = (
        provider: ConnectedProvider | DisconnectedProvider
    ): ProviderChip => {
        if (!("issue" in provider)) {
            return { label: t("connected"), severity: "success" };
        }

        return {
            label: t(
                provider.issue === "not connected" && provider.error === undefined
                    ? "not connected"
                    : "reconnect required"
            ),
            severity: "warning"
        };
    };

    const providers_toOffer = disconnectedProviders?.filter(
        provider => !providers_toFix?.includes(provider)
    );

    const isNoProviderConnected = connectedProviders?.length === 0;

    const isProvidersToOfferVisible =
        !isReadonly &&
        providers_toOffer !== undefined &&
        providers_toOffer.length !== 0 &&
        (mode === "providers" ||
            isNoProviderConnected ||
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
                                accountGitHref={accountGitHref}
                                onSignIn={onSignIn}
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
                                        {t("provider")}
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
                                            setIsChangingRepository(true);
                                            setSearch("");
                                        }}
                                        disabled={
                                            isReadonly || connectedProviders === undefined
                                        }
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
                                            >
                                                <ProviderLabel
                                                    logoUrl={getLogoUrl(provider)}
                                                    displayName={provider.displayName}
                                                    chip={
                                                        "issue" in provider
                                                            ? getProviderChip(provider)
                                                            : undefined
                                                    }
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </div>
                                {isRepositoryPickerVisible || value.url === "" ? (
                                    <div
                                        className={cx(
                                            classes.field,
                                            classes.repositoryField
                                        )}
                                    >
                                        <FieldLabel htmlFor={searchInputId}>
                                            {t("repository")}
                                        </FieldLabel>
                                        <Input
                                            id={searchInputId}
                                            className={classes.filledInput}
                                            disableUnderline={true}
                                            fullWidth={true}
                                            disabled={isReadonly}
                                            value={search}
                                            onChange={event =>
                                                onSearchChange(event.target.value)
                                            }
                                            placeholder={t("repository placeholder")}
                                            endAdornment={
                                                isSearching ? (
                                                    <CircularProgress size={16} />
                                                ) : undefined
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={cx(
                                            classes.field,
                                            classes.repositoryField
                                        )}
                                    >
                                        <Text typo="label 1">{t("repository")}</Text>
                                        <div className={classes.picked}>
                                            <RepositoryPath
                                                fullPath={getRepositoryPath(value.url)}
                                            />
                                            {!isReadonly && (
                                                <Link
                                                    component="button"
                                                    type="button"
                                                    underline="hover"
                                                    className={classes.change}
                                                    onClick={() =>
                                                        setIsChangingRepository(true)
                                                    }
                                                >
                                                    {t("change repository")}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isRepositoryPickerVisible &&
                                provider_toFix !== undefined && (
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
                                        {provider_toFix.error !== undefined && (
                                            <Text typo="body 2" color="secondary">
                                                <CardErrorMessage
                                                    error={provider_toFix.error}
                                                    providerName={
                                                        provider_toFix.displayName
                                                    }
                                                />
                                            </Text>
                                        )}
                                        <ProviderToFixAction
                                            className={
                                                classes.repositoriesUnavailableAction
                                            }
                                            provider={provider_toFix}
                                            isReadonly={isReadonly}
                                            accountGitHref={accountGitHref}
                                            onSignIn={onSignIn}
                                        />
                                    </div>
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
                        {value.url !== "" &&
                            !isProviderNotConnected &&
                            (providerDisplayName_ofUrl !== undefined ? (
                                <div className={classes.detection}>
                                    <Icon
                                        className={classes.detectionIcon_success}
                                        icon={getIconUrlByName("CheckCircle")}
                                        size="extra small"
                                    />
                                    <Text typo="caption">
                                        {t("url on connected provider", {
                                            providerDisplayName: providerDisplayName_ofUrl
                                        })}
                                    </Text>
                                </div>
                            ) : (
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
                            ))}
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
                                noOptionsText={t("no branch found")}
                                renderInput={params => (
                                    <div ref={params.InputProps.ref}>
                                        <Input
                                            inputProps={params.inputProps}
                                            id={branchInputId}
                                            className={classes.filledInput}
                                            disableUnderline={true}
                                            fullWidth={true}
                                            placeholder={t("default branch")}
                                            endAdornment={
                                                branchesState.status === "loading" ? (
                                                    <CircularProgress size={16} />
                                                ) : undefined
                                            }
                                        />
                                    </div>
                                )}
                            />
                            <Text typo="body 2" className={classes.helperText}>
                                {t("optional")}
                            </Text>
                        </div>
                        {value.url !== "" &&
                            providerId_repository !== undefined &&
                            branchSuggestions !== undefined &&
                            branchSuggestions.length !== 0 && (
                                <div className={classes.branchSuggestions}>
                                    {branchSuggestions.map(branch => (
                                        <ButtonBase
                                            key={branch}
                                            className={cx(
                                                classes.branchSuggestion,
                                                branch === value.branch &&
                                                    classes.branchSuggestion_selected
                                            )}
                                            disabled={isReadonly}
                                            aria-pressed={branch === value.branch}
                                            onClick={() => onChange({ ...value, branch })}
                                        >
                                            {branch}
                                        </ButtonBase>
                                    ))}
                                </div>
                            )}
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
}) {
    const { provider, logoUrl, isReadonly, accountGitHref, onSignIn } = props;

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
            />
        </div>
    );
}

/** Signing in again, or the account when it can only be fixed there */
function ProviderToFixAction(props: {
    className?: string;
    provider: DisconnectedProvider;
    isReadonly: boolean;
    accountGitHref: string;
    onSignIn: (params: { providerId: string }) => void;
}) {
    const { className, provider, isReadonly, accountGitHref, onSignIn } = props;

    const { t } = useTranslation({ GitRepositoryFormField });
    const { t: t_card } = useTranslation({ GitProviderCard });

    const { providerId, issue, error, connectionMethod, isSigningIn } = provider;

    // NOTE: The token is typed in the account, and only the provider's
    // settings get rid of a conflicting grant.
    if (
        connectionMethod === "personal-access-token" ||
        error?.type === "grant scope conflict"
    ) {
        return (
            <Link className={className} href={accountGitHref} underline="hover">
                {t("fix in account")}
            </Link>
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

/** One click for OAuth, the account for a personal access token */
function ProviderToOffer(props: {
    provider: DisconnectedProvider;
    logoUrl: string;
    accountGitHref: string;
    onSignIn: (params: { providerId: string }) => void;
}) {
    const { provider, logoUrl, accountGitHref, onSignIn } = props;

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

    return connectionMethod === "oauth" ? (
        <ButtonBase
            className={classes.providerToOffer}
            disabled={isSigningIn}
            onClick={() => onSignIn({ providerId })}
        >
            {children}
        </ButtonBase>
    ) : (
        <ButtonBase className={classes.providerToOffer} href={accountGitHref}>
            {children}
        </ButtonBase>
    );
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

type ProviderChip = { label: string; severity: "success" | "warning" };

function ProviderLabel(props: {
    logoUrl: string;
    displayName: string;
    /** undefined: no chip */
    chip?: ProviderChip;
}) {
    const { logoUrl, displayName, chip } = props;

    const { classes, cx } = useStyles();

    return (
        <span className={classes.providerLabel}>
            <img className={classes.providerLogo} src={logoUrl} alt="" />
            <span className={classes.ellipsis}>{displayName}</span>
            {chip !== undefined && (
                <span
                    className={cx(
                        classes.chip,
                        chip.severity === "warning" && classes.chip_warning
                    )}
                >
                    <span
                        className={cx(
                            classes.chipDot,
                            chip.severity === "warning" && classes.chipDot_warning
                        )}
                    />
                    {chip.label}
                </span>
            )}
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

    const {
        functions: { gitProvidersManagement, launcher }
    } = getCoreSync();

    return (
        <GitRepositoryFormField
            {...props}
            connectedProviders={connectedProviders}
            disconnectedProviders={disconnectedProviders}
            onSignIn={launcher.signInToGitProvider}
            searchRepositories={({ providerId, search, signal }) =>
                gitProvidersManagement.listRepositories({
                    providerId,
                    search,
                    page: 1,
                    signal
                })
            }
            listBranches={gitProvidersManagement.listBranches}
            getConnectedProviderIdOfRepositoryUrl={
                gitProvidersManagement.getConnectedProviderIdOfRepositoryUrl
            }
            accountGitHref={routes.account({ tabId: "git" }).href}
        />
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
    picked: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3),
        // NOTE: The look of the search input it replaces.
        height: 45,
        boxSizing: "border-box",
        padding: theme.spacing({ topBottom: 2, rightLeft: 2.5 }),
        borderRadius: 8,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    change: {
        ...theme.typography.variants["body 2"].style,
        color: theme.colors.useCases.typography.textFocus,
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
        maxHeight: 280,
        overflowY: "auto",
        borderRadius: 12,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        "& > li + li": {
            paddingTop: theme.spacing(1),
            borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`
        }
    },
    repositoryRow: {
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
    chip_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.background
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    chipDot_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.main
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
    repositoriesUnavailableAction: {
        marginTop: theme.spacing(2)
    },
    helperText: {
        color: theme.colors.useCases.typography.textTertiary
    },
    detection: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2)
    },
    detectionIcon_success: {
        color: theme.colors.useCases.alertSeverity.success.main,
        flexShrink: 0
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
    branchSuggestions: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        // NOTE: Centered on the input, not on its label.
        paddingBottom: 4
    },
    branchSuggestion: {
        ...theme.typography.variants["body 2"].style,
        padding: theme.spacing({ topBottom: 1, rightLeft: 3 }),
        borderRadius: 999,
        color: theme.colors.useCases.typography.textSecondary,
        border: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
        "&:hover, &.Mui-focusVisible": {
            color: theme.colors.useCases.typography.textPrimary,
            borderColor: theme.colors.useCases.typography.textSecondary
        }
    },
    branchSuggestion_selected: {
        "&, &:hover": {
            color: theme.colors.useCases.typography.textFocus,
            borderColor: theme.colors.useCases.typography.textFocus,
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
        }
    }
}));

const { i18n } = declareComponentKeys<
    | "mode providers"
    | "mode url"
    | "provider"
    | "repository"
    | "repository placeholder"
    | "change repository"
    | "repository url"
    | { K: "url on connected provider"; P: { providerDisplayName: string } }
    | "url anonymous"
    | "branch"
    | "default branch"
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
    | "connected"
    | "not connected"
    | "reconnect required"
    | "repositories unavailable"
    | "repositories unavailable hint"
    | "optional"
>()({ GitRepositoryFormField });
export type I18n = typeof i18n;
