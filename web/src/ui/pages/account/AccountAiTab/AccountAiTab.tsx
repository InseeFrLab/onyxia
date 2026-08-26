import { memo } from "react";
import { useTranslation } from "ui/i18n";
import openWebUiIconUrl from "ui/assets/img/openWebUiIcon.png";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useConst } from "powerhooks/useConst";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { alpha } from "@mui/material/styles";
import ButtonBase from "@mui/material/ButtonBase";
import { declareComponentKeys } from "i18nifty";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { Icon } from "onyxia-ui/Icon";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { useCoreState, getCoreSync } from "core";
import { getIconUrlByName } from "lazy-icons";
import { ProviderValueField } from "./ProviderValueField";
import { ModelsSection } from "./ModelsSection";
import { CustomProviderFormDialog } from "./CustomProviderFormDialog";
import {
    ConfirmCustomProviderDeletionDialog,
    type Props as ConfirmCustomProviderDeletionDialogProps
} from "./ConfirmCustomProviderDeletionDialog";
import { Divider } from "@mui/material";

export type Props = {
    className?: string;
};

export const AccountAiTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const {
        functions: { ai, aiCustomProviderFormUiController }
    } = getCoreSync();

    const { stateDescription, managedProviders, customProviders } = useCoreState(
        "ai",
        "main"
    );

    const { t } = useTranslation({ AccountAiGatewayTab: AccountAiTab });

    const evtConfirmDeleteDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<ConfirmCustomProviderDeletionDialogProps["evtOpen"]>>()
    );

    const onFieldRequestCopyFactory = useCallbackFactory(([text]: [string]) =>
        copyToClipboard(text)
    );

    const onRefreshClickFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.refreshToken({ providerId })
    );

    const onSetDefaultProviderFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.setActiveProvider({
            activeProviderId: providerId
        })
    );

    const onDeleteCustomProviderFactory = useCallbackFactory(
        async ([providerId]: [string]) => {
            const dDoProceed = new Deferred<boolean>();

            evtConfirmDeleteDialogOpen.post({
                resolveDoProceed: dDoProceed.resolve
            });

            if (!(await dDoProceed.pr)) {
                return;
            }

            await ai.deleteCustomProvider({ providerId });
        }
    );

    const onAddClick = useConstCallback(() =>
        aiCustomProviderFormUiController.open({ providerId: undefined })
    );

    const onEditClickFactory = useCallbackFactory(([providerId]: [string]) =>
        aiCustomProviderFormUiController.open({ providerId })
    );

    if (stateDescription !== "initialized") {
        return stateDescription === "error" ? (
            <Text typo="body 1" className={classes.errorText}>
                {t("gateway error")}
            </Text>
        ) : (
            <CircularProgress />
        );
    }

    const renderDefaultProviderAction = (params: {
        providerId: string;
        isDefault: boolean;
    }) =>
        params.isDefault ? (
            <div className={classes.defaultProviderBadge}>
                <Icon
                    icon={getIconUrlByName("Check")}
                    size="extra small"
                    className={classes.defaultProviderBadgeIcon}
                />
                <Text typo="label 2" className={classes.defaultProviderBadgeText}>
                    {t("default provider")}
                </Text>
            </div>
        ) : (
            <Button
                variant="secondary"
                onClick={onSetDefaultProviderFactory(params.providerId)}
                className={classes.compactActionButton}
            >
                {t("set default provider")}
            </Button>
        );

    return (
        <div className={className}>
            <div className={classes.accountAiTabContent}>
                {managedProviders.map(managedProvider => (
                    <div
                        key={managedProvider.id}
                        className={classes.managedProviderSection}
                    >
                        <div className={classes.managedProviderHeader}>
                            <Text typo="section heading">{managedProvider.name}</Text>
                            <div className={classes.managedProviderSubtitleRow}>
                                <Text
                                    typo="body 2"
                                    className={classes.managedProviderDescription}
                                >
                                    {managedProvider.description === undefined ? (
                                        t("credentials section helper", {
                                            webUiUrl: managedProvider.webUiUrl
                                        })
                                    ) : (
                                        <LocalizedMarkdown inline>
                                            {managedProvider.description}
                                        </LocalizedMarkdown>
                                    )}
                                </Text>
                                {managedProvider.auth.stateDescription ===
                                    "authenticated" && (
                                    <div className={classes.providerCardActions}>
                                        <Button
                                            variant="ternary"
                                            startIcon={getIconUrlByName("Refresh")}
                                            onClick={onRefreshClickFactory(
                                                managedProvider.id
                                            )}
                                            className={classes.compactActionButton}
                                        >
                                            {t("refresh credentials")}
                                        </Button>
                                        {renderDefaultProviderAction({
                                            providerId: managedProvider.id,
                                            isDefault: managedProvider.isDefault
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {managedProvider.auth.stateDescription === "no account" &&
                            (() => {
                                const { accountCreation } = managedProvider;

                                if (
                                    accountCreation === undefined ||
                                    (accountCreation.title === undefined &&
                                        accountCreation.description === undefined &&
                                        accountCreation.buttonLabel === undefined)
                                ) {
                                    return (
                                        <Text typo="body 1">
                                            {t("no account", {
                                                webUiUrl: managedProvider.webUiUrl
                                            })}
                                        </Text>
                                    );
                                }
                                return (
                                    <div className={classes.noAccountCard}>
                                        <div className={classes.noAccountText}>
                                            <div className={classes.noAccountTitle}>
                                                <img
                                                    src={openWebUiIconUrl}
                                                    alt=""
                                                    width={32}
                                                    height={32}
                                                    className={classes.noAccountLogo}
                                                />
                                                {accountCreation.title !== undefined && (
                                                    <Text
                                                        typo="body 1"
                                                        className={
                                                            classes.noAccountTitleText
                                                        }
                                                    >
                                                        <LocalizedMarkdown inline>
                                                            {accountCreation.title}
                                                        </LocalizedMarkdown>
                                                    </Text>
                                                )}
                                            </div>
                                            <Text
                                                typo="body 2"
                                                className={classes.noAccountDescription}
                                            >
                                                {accountCreation.description ===
                                                undefined ? (
                                                    t("no account", {
                                                        webUiUrl: managedProvider.webUiUrl
                                                    })
                                                ) : (
                                                    <LocalizedMarkdown inline>
                                                        {accountCreation.description}
                                                    </LocalizedMarkdown>
                                                )}
                                            </Text>
                                        </div>
                                        {accountCreation.buttonLabel !== undefined && (
                                            <Button
                                                href={managedProvider.webUiUrl}
                                                doOpenNewTabIfHref={true}
                                                className={classes.noAccountButton}
                                            >
                                                <LocalizedMarkdown inline>
                                                    {accountCreation.buttonLabel}
                                                </LocalizedMarkdown>
                                            </Button>
                                        )}
                                    </div>
                                );
                            })()}

                        {managedProvider.auth.stateDescription === "error" && (
                            <Text typo="body 1" className={classes.errorText}>
                                {t("gateway error")}
                            </Text>
                        )}

                        {managedProvider.auth.stateDescription === "authenticated" && (
                            <div className={classes.providerFields}>
                                <ProviderValueField
                                    label={t("api base url")}
                                    value={managedProvider.apiBase}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        managedProvider.apiBase
                                    )}
                                />
                                <ProviderValueField
                                    label={t("token")}
                                    value={managedProvider.auth.token}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        managedProvider.auth.token
                                    )}
                                    isSensitiveInformation={true}
                                />
                                <ModelsSection
                                    models={managedProvider.models}
                                    selectedModel={managedProvider.selectedModelId}
                                    onSelectedModelChange={modelId =>
                                        ai.setSelectedModel({
                                            providerId: managedProvider.id,
                                            modelId
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>
                ))}
                <div className={classes.customProvidersSection}>
                    <Divider />

                    <div>
                        <Text typo="section heading">
                            {t("custom providers section title")}
                        </Text>
                        <Text
                            typo="body 2"
                            color="secondary"
                            // className={classes.customProvidersDescription}
                        >
                            {t("custom providers section helper")}
                        </Text>
                    </div>

                    {customProviders.map(provider => (
                        <div key={provider.id} className={classes.customProviderCard}>
                            <div className={classes.customProviderHeader}>
                                <Text typo="object heading">{provider.name}</Text>
                                <div className={classes.providerCardActions}>
                                    <Button
                                        variant="ternary"
                                        startIcon={getIconUrlByName("Delete")}
                                        onClick={onDeleteCustomProviderFactory(
                                            provider.id
                                        )}
                                        className={classes.compactActionButton}
                                    >
                                        {t("delete provider")}
                                    </Button>
                                    <Button
                                        variant="ternary"
                                        startIcon={getIconUrlByName("Edit")}
                                        onClick={onEditClickFactory(provider.id)}
                                        className={classes.compactActionButton}
                                    >
                                        {t("edit provider")}
                                    </Button>
                                    {renderDefaultProviderAction({
                                        providerId: provider.id,
                                        isDefault: provider.isDefault
                                    })}
                                </div>
                            </div>
                            <div className={classes.customProviderFields}>
                                <ProviderValueField
                                    label={t("custom provider api base field")}
                                    value={provider.apiBase}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        provider.apiBase
                                    )}
                                />
                                <ProviderValueField
                                    label={t("custom provider api key field")}
                                    value={provider.apiKey}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        provider.apiKey
                                    )}
                                    isSensitiveInformation={true}
                                />
                                <ModelsSection
                                    models={provider.models}
                                    selectedModel={provider.selectedModelId}
                                    onSelectedModelChange={modelId =>
                                        ai.setSelectedModel({
                                            providerId: provider.id,
                                            modelId
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ))}

                    <ButtonBase
                        type="button"
                        className={classes.addCustomProviderAction}
                        onClick={onAddClick}
                    >
                        <Icon icon={getIconUrlByName("Add")} size="default" />
                        <Text typo="object heading" htmlComponent="span">
                            {t("add custom ai provider")}
                        </Text>
                    </ButtonBase>
                </div>
            </div>
            <CustomProviderFormDialog />
            <ConfirmCustomProviderDeletionDialog evtOpen={evtConfirmDeleteDialogOpen} />
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "default provider"
    | "set default provider"
    | "refresh credentials"
    | "delete provider"
    | "edit provider"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "token"
    | "gateway error"
    | "custom providers section title"
    | "custom providers section helper"
    | "add custom ai provider"
    | "custom provider api base field"
    | "custom provider api key field"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiGatewayTab: AccountAiTab });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ AccountAiGatewayTab: AccountAiTab })
    .create(({ theme }) => ({
        accountAiTabContent: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(5)
        },
        managedProviderSection: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            "& + &": {
                marginTop: theme.spacing(5)
            }
        },
        managedProviderHeader: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(0.5)
        },
        managedProviderSubtitleRow: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            flexWrap: "wrap"
        },
        managedProviderDescription: {
            flex: 1,
            minWidth: 260,
            color: theme.colors.useCases.typography.textSecondary
        },
        customProvidersSection: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(5)
        },

        customProviderCard: {
            border: `1px solid ${theme.colors.useCases.typography.textDisabled}`,
            borderRadius: theme.spacing(3),
            padding: theme.spacing(4),
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3)
        },
        customProviderHeader: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        },
        providerCardActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            flexWrap: "wrap",
            justifyContent: "flex-end"
        },
        compactActionButton: {
            ...theme.typography.variants["label 2"].style,
            boxSizing: "border-box",
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            paddingLeft: theme.spacing(2.5),
            paddingRight: theme.spacing(2.5),
            "& .MuiButton-startIcon": {
                marginLeft: 0,
                marginRight: theme.spacing(1)
            },
            "& .MuiButton-startIcon > *": {
                fontSize: theme.iconSizesInPxByName["extra small"]
            }
        },
        defaultProviderBadge: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing(1),
            boxSizing: "border-box",
            padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`,
            borderRadius: 9999,
            backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.1)
        },
        defaultProviderBadgeIcon: {
            color: theme.colors.useCases.typography.textFocus
        },
        defaultProviderBadgeText: {
            color: theme.colors.useCases.typography.textPrimary
        },
        providerFields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            paddingLeft: theme.spacing(6),
            paddingRight: theme.spacing(6)
        },
        customProviderFields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            paddingLeft: theme.spacing(4),
            paddingRight: theme.spacing(4)
        },
        addCustomProviderAction: {
            justifyContent: "flex-start",
            gap: theme.spacing(4),
            padding: theme.spacing(4),
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            borderRadius: theme.spacing(3),
            textAlign: "left",
            transition: theme.muiTheme.transitions.create("background-color"),
            "&:hover": {
                backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.4)
            },
            "&:focus-visible": {
                outlineWidth: theme.spacing(0.5),
                outlineStyle: "solid",
                outlineColor: theme.colors.useCases.typography.textFocus,
                outlineOffset: theme.spacing(0.5)
            }
        },
        noAccountCard: {
            maxWidth: 759,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: theme.spacing(3),
            padding: theme.spacing(3),
            borderRadius: theme.spacing(2),
            backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.1)
        },
        noAccountText: {
            width: "100%"
        },
        noAccountTitle: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1)
        },
        noAccountLogo: {
            flexShrink: 0,
            width: 32,
            height: 32,
            objectFit: "contain",
            display: "block"
        },
        noAccountTitleText: {
            minWidth: 0,
            fontWeight: 600
        },
        noAccountDescription: {
            marginTop: theme.spacing(1),
            color: theme.colors.useCases.typography.textSecondary
        },
        noAccountButton: {
            alignSelf: "flex-end"
        },
        errorText: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));
