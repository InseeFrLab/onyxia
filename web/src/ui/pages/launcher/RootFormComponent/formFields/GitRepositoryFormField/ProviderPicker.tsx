import { useEffect, useId, useRef, useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import { Link } from "@mui/material";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { GitRepository } from "core/ports/GitProvider";
import type { FieldView } from "core/usecases/gitRepositoryFieldUiController";
import { ProviderNotice } from "./ProviderNotices";
import { FieldLabel, ProviderLabel, ProviderMenuItemContent } from "./ProviderLabels";
import { useGetProviderChip, useGetProviderLogoUrl } from "./useProviderDisplay";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";
import { getFieldStyle } from "ui/shared/fieldStyle";

export type ProviderPickerCallbacks = {
    onProviderSelect: (providerId: string) => void;
    onSearchChange: (search: string) => void;
    /** Typing over the picked repository starts a new search */
    onPickedRepositoryEdit: (search: string) => void;
    onRepositoryClear: () => void;
    onRepositoryPick: (repository: GitRepository) => void;
    onMoreRepositoriesRequest: () => void;
    onSignIn: (params: { providerId: string }) => void;
    onManage: (params: { providerId: string }) => void;
};

/** Mode providers: a Git profile, then one of its repositories */
export function ProviderPicker(
    props: ProviderPickerCallbacks & {
        picker: FieldView["providerPicker"];
        value: FieldView["value"];
        isReadonly: boolean;
        accountGitHref: string;
        searchInputId: string;
    }
) {
    const { picker, value, isReadonly, accountGitHref, searchInputId } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const getLogoUrl = useGetProviderLogoUrl();
    const getProviderChip = useGetProviderChip();
    const providerSelectId = useId();

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isSearchFocusRequested, setIsSearchFocusRequested] = useState(false);

    // NOTE: Once cleared, the search input is back: the user types the next one.
    useEffect(() => {
        if (isSearchFocusRequested) {
            searchInputRef.current?.focus();
            setIsSearchFocusRequested(false);
        }
    }, [isSearchFocusRequested]);

    switch (picker.status) {
        case "nothing to pick":
            // NOTE: What to connect is listed above, or needs fixing.
            return null;
        case "none":
            return (
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
            );
    }

    const { repositoryList } = picker;

    return (
        <div className={classes.section}>
            <div className={classes.row}>
                <div className={cx(classes.field, classes.provider)}>
                    <FieldLabel htmlFor={providerSelectId}>{t("git profile")}</FieldLabel>
                    <Select
                        id={providerSelectId}
                        className={classes.providerSelect}
                        input={
                            <Input
                                disableUnderline={true}
                                className={classes.filledInput}
                            />
                        }
                        value={picker.providerId}
                        displayEmpty={true}
                        onChange={event => props.onProviderSelect(event.target.value)}
                        disabled={isReadonly || picker.status === "loading"}
                        MenuProps={{
                            // NOTE: Under the field, not over it on the selected one.
                            anchorOrigin: { vertical: "bottom", horizontal: "left" },
                            transformOrigin: { vertical: "top", horizontal: "left" },
                            slotProps: { paper: { className: classes.providerMenu } }
                        }}
                        renderValue={providerId => {
                            const provider = picker.providers.find(
                                provider => provider.providerId === providerId
                            );

                            if (provider === undefined) {
                                const { unknownRepository } = picker;

                                return unknownRepository === undefined ? null : (
                                    <span className={classes.providerLabel}>
                                        <Icon
                                            className={classes.repositoryIcon}
                                            icon={getIconUrlByName(
                                                unknownRepository.isProviderNotConnected
                                                    ? "ErrorOutline"
                                                    : "Public"
                                            )}
                                            size="extra small"
                                        />
                                        <span className={classes.ellipsis}>
                                            {unknownRepository.host}
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
                        {picker.providers.map(provider => (
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
                <div className={cx(classes.field, classes.repositoryField)}>
                    <FieldLabel htmlFor={searchInputId}>{t("search")}</FieldLabel>
                    <Input
                        id={searchInputId}
                        className={classes.filledInput}
                        disableUnderline={true}
                        fullWidth={true}
                        disabled={isReadonly}
                        inputRef={searchInputRef}
                        value={picker.searchInputText}
                        onChange={event =>
                            picker.isRepositoryPicked
                                ? props.onPickedRepositoryEdit(event.target.value)
                                : props.onSearchChange(event.target.value)
                        }
                        placeholder={t("repository placeholder")}
                        endAdornment={
                            picker.isSearching ? (
                                <CircularProgress size={16} />
                            ) : (
                                picker.isRepositoryPicked &&
                                !isReadonly && (
                                    <IconButton
                                        size="small"
                                        icon={getIconUrlByName("Cancel")}
                                        aria-label={t("clear repository")}
                                        onClick={() => {
                                            props.onRepositoryClear();
                                            setIsSearchFocusRequested(true);
                                        }}
                                    />
                                )
                            )
                        }
                    />
                </div>
            </div>
            {picker.providerToConnect !== undefined && (
                <>
                    <ProviderNotice
                        provider={picker.providerToConnect}
                        isReadonly={isReadonly}
                        accountGitHref={accountGitHref}
                        onSignIn={props.onSignIn}
                        onManage={props.onManage}
                    />
                    <div className={classes.repositoriesUnavailable}>
                        <Text
                            typo="label 1"
                            className={classes.repositoriesUnavailableTitle}
                        >
                            {t("repositories unavailable")}
                        </Text>
                        <Text typo="body 1">{t("repositories unavailable hint")}</Text>
                    </div>
                </>
            )}
            {repositoryList !== undefined && (
                <div className={classes.repositoriesWrapper}>
                    <ul
                        className={classes.repositories}
                        aria-label={t(repositoryList.heading)}
                        aria-busy={picker.isSearching}
                    >
                        {picker.isSearching &&
                            repositoryList.repositories.length === 0 &&
                            // NOTE: Only when there is nothing to show yet.
                            [0, 1, 2].map(i => (
                                <li key={i} className={classes.repositoryRow}>
                                    <Skeleton width="40%" />
                                </li>
                            ))}
                        {repositoryList.isEmpty && (
                            <li className={classes.repositoriesEmpty}>
                                <Text typo="body 2" color="secondary">
                                    {t("no repository found")}
                                </Text>
                            </li>
                        )}
                        {repositoryList.repositories.map(repository => (
                            <li key={repository.id}>
                                <ButtonBase
                                    className={cx(
                                        classes.repositoryRow,
                                        classes.repositoryButton,
                                        repository.httpCloneUrl === value.url &&
                                            classes.repositoryButton_selected
                                    )}
                                    disabled={isReadonly}
                                    onClick={() => props.onRepositoryPick(repository)}
                                >
                                    <Icon
                                        className={classes.repositoryIcon}
                                        icon={getIconUrlByName("AccountTreeOutlined")}
                                        size="extra small"
                                    />
                                    <Text typo="label 1" className={classes.ellipsis}>
                                        {repository.fullPath}
                                    </Text>
                                </ButtonBase>
                            </li>
                        ))}
                        {repositoryList.isMoreAvailable && (
                            <li>
                                <ButtonBase
                                    className={cx(
                                        classes.repositoryRow,
                                        classes.repositoryButton,
                                        classes.moreRepositories
                                    )}
                                    disabled={isReadonly || picker.isSearching}
                                    onClick={props.onMoreRepositoriesRequest}
                                >
                                    {picker.isSearching ? (
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
    );
}

/** The repositories shown at once, the others are scrolled to */
const REPOSITORIES_VISIBLE_MAX = 5;
const REPOSITORY_ROW_HEIGHT_PX = 36;

const useStyles = tss.withName("ProviderPicker").create(({ theme }) => {
    const { ellipsis, field, filledInput, providerLabel, section } = getSharedStyles({
        theme
    });

    return {
        ellipsis,
        field,
        filledInput,
        providerLabel,
        section,
        moreRepositories: {
            justifyContent: "center",
            color: theme.colors.useCases.typography.textFocus
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
        provider: {
            // NOTE: Room for the logo, a name like "GitLab SSPCloud" and its chip.
            flex: "0 1 360px",
            minWidth: 280
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
        providerSelect: {
            "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center"
            }
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
        repositoriesEmpty: {
            padding: theme.spacing(4),
            textAlign: "center"
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
        repositoriesWrapper: {
            display: "flex",
            flexDirection: "column"
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
        repositoryField: {
            // NOTE: Below the provider rather than squeezed next to it.
            flex: "1 1 280px"
        },
        repositoryIcon: {
            color: theme.colors.useCases.typography.textSecondary,
            flexShrink: 0
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
        row: {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: theme.spacing(2.5)
        }
    };
});
