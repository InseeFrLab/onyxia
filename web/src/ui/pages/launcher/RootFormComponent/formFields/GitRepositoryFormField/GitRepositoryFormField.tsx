import { memo, useId } from "react";
import Input from "@mui/material/Input";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { FieldView, Mode } from "core/usecases/gitRepositoryFieldUiController";
import { FormFieldWrapper } from "../shared/FormFieldWrapper";
import { ProviderToFix, ProviderToOffer } from "./ProviderNotices";
import { ProviderPicker, type ProviderPickerCallbacks } from "./ProviderPicker";
import { BranchField } from "./BranchField";
import { FieldLabel } from "./ProviderLabels";
import { useGetProviderLogoUrl } from "./useProviderDisplay";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";

export type Props = ProviderPickerCallbacks & {
    className?: string;
    title: string;
    description: string | undefined;
    onRemove: (() => void) | undefined;
    /** What the field displays, computed in gitRepositoryFieldUiController */
    view: FieldView;
    accountGitHref: string;
    onModeChange: (mode: Mode) => void;
    onUrlInputChange: (urlInput: string) => void;
    onBranchChange: (branch: string) => void;
    onBranchSearchChange: (branchSearch: string) => void;
};

/**
 * A repository picked on a connected provider, or typed as a url, then a branch.
 * The repository is only written to the helm values once picked or a complete url typed.
 */
export const GitRepositoryFormField = memo((props: Props) => {
    const { className, title, description, onRemove, view, accountGitHref } = props;
    const { value, isReadonly, mode } = view;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitRepositoryFormField });
    const getLogoUrl = useGetProviderLogoUrl();
    const searchInputId = useId();
    const urlInputId = useId();

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={view.error === undefined ? undefined : t(view.error)}
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
                            props.onModeChange(mode);
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
                    view.providersToFix.map(provider => (
                        <ProviderToFix
                            key={provider.providerId}
                            provider={provider}
                            logoUrl={getLogoUrl(provider)}
                            isReadonly={isReadonly}
                            accountGitHref={accountGitHref}
                            onSignIn={props.onSignIn}
                            onManage={props.onManage}
                        />
                    ))}
                {view.providersToOffer !== undefined && (
                    <div className={classes.providersToOffer}>
                        <Text typo="body 2" color="secondary">
                            {t(
                                view.providersToOffer.isNoProviderConnected
                                    ? "connect a provider to use your repositories"
                                    : "connect another provider"
                            )}
                        </Text>
                        {view.providersToOffer.providers.map(provider => (
                            <ProviderToOffer
                                key={provider.providerId}
                                provider={provider}
                                logoUrl={getLogoUrl(provider)}
                                onSignIn={props.onSignIn}
                                onManage={props.onManage}
                            />
                        ))}
                    </div>
                )}
                {mode === "providers" && (
                    <ProviderPicker
                        {...props}
                        picker={view.providerPicker}
                        value={value}
                        isReadonly={isReadonly}
                        searchInputId={searchInputId}
                    />
                )}
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
                                value={view.urlInput.text}
                                onChange={event =>
                                    props.onUrlInputChange(event.target.value)
                                }
                                placeholder="https://github.com/owner/repository.git"
                            />
                        </div>
                        {view.urlInput.hasCredentials && (
                            <Text typo="caption" className={classes.urlError}>
                                {t("url with credentials")}
                            </Text>
                        )}
                        {/* NOTE: Every connected provider's credentials are given to the
                        service: only a url on none of them needs telling. */}
                        {view.urlInput.isAnonymous && (
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
                <BranchField
                    branch={view.branch}
                    value={value.branch}
                    onChange={props.onBranchChange}
                    onSearchChange={props.onBranchSearchChange}
                />
            </div>
        </FormFieldWrapper>
    );
});

const useStyles = tss.withName("GitRepositoryFormField").create(({ theme }) => {
    const { field, filledInput, section } = getSharedStyles({ theme });

    return {
        field,
        filledInput,
        section,
        adornment: {
            color: theme.colors.useCases.typography.textSecondary,
            marginRight: theme.spacing(2),
            flexShrink: 0
        },
        detection: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2)
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
        modes: {
            flexShrink: 0,
            padding: theme.spacing(1),
            gap: theme.spacing(1),
            borderRadius: 12,
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        providersToOffer: {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing(2)
        },
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(4)
        },
        urlError: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    };
});

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
