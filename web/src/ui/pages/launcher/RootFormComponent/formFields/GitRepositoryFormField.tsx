import { memo, useEffect, useId, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Link } from "@mui/material";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { useCoreState, getCoreSync } from "core";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { GitRepository } from "core/ports/GitProvider";
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
    searchRepositories: (params: {
        providerId: string;
        search: string;
        signal: AbortSignal;
    }) => Promise<GitRepository[]>;
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

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Provisional UI: a provider, a repository (searched, or a pasted url) and a branch.
 * The repository is only written to the helm values once picked or pasted.
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
        searchRepositories,
        listBranches,
        getConnectedProviderIdOfRepositoryUrl,
        accountGitHref
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
    const inputId = useId();

    const [providerId_selected, setProviderId_selected] = useState<string | undefined>(
        value.providerId === "" ? undefined : value.providerId
    );

    // NOTE: The favorite, once the providers are known, when nothing is picked yet.
    const providerId =
        providerId_selected !== undefined &&
        connectedProviders?.some(({ providerId }) => providerId === providerId_selected)
            ? providerId_selected
            : connectedProviders?.[0]?.providerId;

    const [search, setSearch] = useState("");
    const [searchState, setSearchState] = useState<
        | { status: "idle" }
        | { status: "loading" }
        | { status: "loaded"; repositories: GitRepository[] }
        | { status: "failed" }
    >({ status: "idle" });

    useEffect(() => {
        if (providerId === undefined || isReadonly) {
            return;
        }

        const abortController = new AbortController();

        setSearchState({ status: "loading" });

        const timer = setTimeout(() => {
            searchRepositories({
                providerId,
                search,
                signal: abortController.signal
            }).then(
                repositories => setSearchState({ status: "loaded", repositories }),
                () => {
                    if (!abortController.signal.aborted) {
                        setSearchState({ status: "failed" });
                    }
                }
            );
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [providerId, search, isReadonly]);

    const repositories = searchState.status === "loaded" ? searchState.repositories : [];

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
        if (providerId_repository === undefined || isReadonly) {
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
    }, [providerId_repository, value.url, branchSearch, isReadonly]);

    const branches = branchesState.status === "loaded" ? branchesState.branches : [];

    const isProviderNotConnected =
        value.url !== "" &&
        connectedProviders !== undefined &&
        (value.providerId === ""
            ? getConnectedProviderIdOfRepositoryUrl({ url: value.url }) === undefined
            : !connectedProviders.some(
                  ({ providerId }) => providerId === value.providerId
              ));

    const onUrlPasted = (url: string) => {
        const url_trimmed = url.trim();

        // NOTE: Not the label of the picked repository (its path), nor a search.
        if (!/^https?:\/\//.test(url_trimmed) || url_trimmed === value.url) {
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

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={
                searchState.status === "failed"
                    ? t("search failed")
                    : isProviderNotConnected
                      ? t("provider not connected")
                      : undefined
            }
            onResetToDefault={undefined}
            inputId={inputId}
            onRemove={onRemove}
        >
            {connectedProviders !== undefined && connectedProviders.length === 0 && (
                <Text typo="caption" className={classes.hint}>
                    {t("no provider connected")}{" "}
                    <Link href={accountGitHref} underline="hover">
                        {t("connect a provider")}
                    </Link>
                </Text>
            )}
            <div className={classes.row}>
                {connectedProviders !== undefined && connectedProviders.length !== 0 && (
                    <Select
                        className={classes.provider}
                        value={providerId ?? ""}
                        onChange={event => setProviderId_selected(event.target.value)}
                        disabled={isReadonly}
                        inputProps={{ "aria-label": t("provider") }}
                    >
                        {connectedProviders.map(provider => (
                            <MenuItem
                                key={provider.providerId}
                                value={provider.providerId}
                            >
                                {provider.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                <Autocomplete<GitRepository, false, false, true>
                    className={classes.repository}
                    freeSolo={true}
                    disabled={isReadonly}
                    options={repositories}
                    // NOTE: The provider already filters on the search.
                    filterOptions={options => options}
                    loading={searchState.status === "loading"}
                    getOptionLabel={option =>
                        typeof option === "string"
                            ? getRepositoryPath(option)
                            : option.fullPath
                    }
                    getOptionKey={option =>
                        typeof option === "string" ? option : option.id
                    }
                    value={value.url === "" ? null : value.url}
                    onInputChange={(_event, inputValue, reason) => {
                        if (reason === "input") {
                            setSearch(inputValue);
                        }
                    }}
                    onChange={(_event, option) => {
                        if (option === null) {
                            return;
                        }

                        if (typeof option === "string") {
                            onUrlPasted(option);
                            return;
                        }

                        onChange({
                            providerId: providerId ?? "",
                            url: option.httpCloneUrl,
                            branch: option.defaultBranch ?? ""
                        });
                    }}
                    renderOption={({ key, ...optionProps }, option) => (
                        <li key={key} {...optionProps}>
                            <div className={classes.option}>
                                <Text typo="body 1">{option.fullPath}</Text>
                                {option.description !== undefined && (
                                    <Text typo="caption" className={classes.hint}>
                                        {option.description}
                                    </Text>
                                )}
                            </div>
                        </li>
                    )}
                    noOptionsText={t("no repository found")}
                    renderInput={params => (
                        <div ref={params.InputProps.ref} className={classes.inputWrapper}>
                            <Input
                                inputProps={params.inputProps}
                                id={inputId}
                                fullWidth={true}
                                placeholder={t("repository placeholder")}
                                onBlur={event => onUrlPasted(event.target.value)}
                                endAdornment={
                                    searchState.status === "loading" ? (
                                        <CircularProgress size={16} />
                                    ) : undefined
                                }
                            />
                        </div>
                    )}
                />
                <Autocomplete<string, false, false, true>
                    className={classes.branch}
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
                                inputProps={{
                                    ...params.inputProps,
                                    "aria-label": t("branch")
                                }}
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
            </div>
        </FormFieldWrapper>
    );
});

/** group/project of the clone url, the url itself when it doesn't look like one */
function getRepositoryPath(url: string): string {
    try {
        const path = new URL(url).pathname.replace(/^\/+/, "").replace(/\.git$/, "");

        return path === "" ? url : path;
    } catch {
        return url;
    }
}

/** Reads the connected providers and searches the repositories in the core */
export function GitRepositoryFormFieldContainer(
    props: Omit<
        Props,
        | "connectedProviders"
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

    const {
        functions: { gitProvidersManagement }
    } = getCoreSync();

    return (
        <GitRepositoryFormField
            {...props}
            connectedProviders={connectedProviders}
            searchRepositories={async ({ providerId, search, signal }) =>
                (
                    await gitProvidersManagement.listRepositories({
                        providerId,
                        search,
                        page: 1,
                        signal
                    })
                ).repositories
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
    row: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: theme.spacing(2)
    },
    provider: {
        minWidth: 160
    },
    repository: {
        flex: 1,
        minWidth: 240
    },
    inputWrapper: {
        width: "100%"
    },
    branch: {
        width: 180
    },
    option: {
        display: "flex",
        flexDirection: "column"
    },
    hint: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));

const { i18n } = declareComponentKeys<
    | "provider"
    | "repository placeholder"
    | "branch"
    | "default branch"
    | "no branch found"
    | "no repository found"
    | "search failed"
    | "provider not connected"
    | "no provider connected"
    | "connect a provider"
>()({ GitRepositoryFormField });
export type I18n = typeof i18n;
