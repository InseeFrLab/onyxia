import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useConst } from "powerhooks/useConst";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { useCoreState, getCoreSync } from "core";
import { getIconUrlByName } from "lazy-icons";
import { ProviderValueField } from "./ProviderValueField";
import { ModelsSection } from "./ModelsSection";
import {
    CustomProviderFormDialog,
    type Props as CustomProviderFormDialogProps
} from "./CustomProviderFormDialog";

export type Props = {
    className?: string;
};

export const AccountAiTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const {
        functions: { ai }
    } = getCoreSync();

    const { stateDescription, regionProviders, customProviders } = useCoreState(
        "ai",
        "main"
    );

    const { t } = useTranslation({ AccountAiGatewayTab: AccountAiTab });

    const evtCustomProviderFormDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<CustomProviderFormDialogProps["evtOpen"]>>()
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

    const onDeleteCustomProviderFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.deleteCustomProvider({ providerId })
    );

    const onAddClick = useConstCallback(() =>
        evtCustomProviderFormDialogOpen.post({ editedProvider: undefined })
    );

    const onEditClickFactory = useCallbackFactory(([providerId]: [string]) => {
        const provider = customProviders.find(p => p.id === providerId);
        if (provider === undefined) return;
        evtCustomProviderFormDialogOpen.post({
            editedProvider: {
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                apiBase: provider.apiBase,
                apiKey: provider.apiKey
            }
        });
    });

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
            {regionProviders.map(regionProvider => (
                <div key={regionProvider.id} className={classes.providerCard}>
                    <div className={classes.providerCardHeader}>
                        <Text typo="label 1">{regionProvider.name}</Text>
                        <div className={classes.providerCardActions}>
                            {regionProvider.auth.stateDescription === "authenticated" && (
                                <>
                                    <Button
                                        variant="ternary"
                                        startIcon={getIconUrlByName("Refresh")}
                                        onClick={onRefreshClickFactory(regionProvider.id)}
                                        className={classes.compactActionButton}
                                    >
                                        {t("refresh credentials")}
                                    </Button>
                                    {renderDefaultProviderAction({
                                        providerId: regionProvider.id,
                                        isDefault: regionProvider.isDefault
                                    })}
                                </>
                            )}
                        </div>
                    </div>

                    {regionProvider.auth.stateDescription === "no account" && (
                        <Text typo="body 1">
                            {t("no account", { webUiUrl: regionProvider.webUiUrl })}
                        </Text>
                    )}

                    {regionProvider.auth.stateDescription === "error" && (
                        <Text typo="body 1" className={classes.errorText}>
                            {t("gateway error")}
                        </Text>
                    )}

                    {regionProvider.auth.stateDescription === "authenticated" && (
                        <>
                            <SettingSectionHeader
                                title={t("credentials section title")}
                                helperText={t("credentials section helper", {
                                    webUiUrl: regionProvider.webUiUrl
                                })}
                            />
                            <div className={classes.providerFields}>
                                <ProviderValueField
                                    label={t("api base url")}
                                    value={regionProvider.apiBase}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        regionProvider.apiBase
                                    )}
                                />
                                <ProviderValueField
                                    label={t("token")}
                                    value={regionProvider.auth.token}
                                    onRequestCopy={onFieldRequestCopyFactory(
                                        regionProvider.auth.token
                                    )}
                                    isSensitiveInformation={true}
                                />
                                <ModelsSection
                                    providerId={regionProvider.id}
                                    models={regionProvider.models}
                                    selectedModel={regionProvider.selectedModelId}
                                />
                            </div>
                        </>
                    )}
                </div>
            ))}

            <div className={classes.customProvidersSectionHeader}>
                <SettingSectionHeader
                    title={t("custom providers section title")}
                    helperText={t("custom providers section helper")}
                />
                <IconButton
                    icon={getIconUrlByName("Add")}
                    onClick={onAddClick}
                    size="small"
                />
            </div>

            {customProviders.map(provider => (
                <div key={provider.id} className={classes.providerCard}>
                    <div className={classes.providerCardHeader}>
                        <Text typo="label 1">{provider.name}</Text>
                        <div className={classes.providerCardActions}>
                            <Button
                                variant="ternary"
                                startIcon={getIconUrlByName("Delete")}
                                onClick={onDeleteCustomProviderFactory(provider.id)}
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
                    <div className={classes.providerFields}>
                        <ProviderValueField
                            label={t("custom provider api base field")}
                            value={provider.apiBase}
                            onRequestCopy={onFieldRequestCopyFactory(provider.apiBase)}
                        />
                        <ProviderValueField
                            label={t("custom provider api key field")}
                            value={provider.apiKey}
                            onRequestCopy={onFieldRequestCopyFactory(provider.apiKey)}
                            isSensitiveInformation={true}
                        />
                        <ModelsSection
                            providerId={provider.id}
                            models={provider.models}
                            selectedModel={provider.selectedModelId}
                        />
                    </div>
                </div>
            ))}

            <CustomProviderFormDialog evtOpen={evtCustomProviderFormDialogOpen} />
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "default provider"
    | "set default provider"
    | "refresh credentials"
    | "delete provider"
    | "edit provider"
    | "credentials section title"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "token"
    | "gateway error"
    | "custom providers section title"
    | "custom providers section helper"
    | "custom provider api base field"
    | "custom provider api key field"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiGatewayTab: AccountAiTab });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ AccountAiGatewayTab: AccountAiTab })
    .create(({ theme }) => ({
        customProvidersSectionHeader: {
            display: "flex",
            alignItems: "flex-start",
            gap: theme.spacing(1),
            marginTop: theme.spacing(4)
        },
        providerCard: {
            border: `1px solid ${theme.colors.useCases.typography.textDisabled}`,
            borderRadius: theme.spacing(1),
            padding: theme.spacing(3),
            marginTop: theme.spacing(3)
        },
        providerCardHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.spacing(2)
        },
        providerCardActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexWrap: "wrap",
            justifyContent: "flex-end"
        },
        compactActionButton: {
            minHeight: 28,
            paddingTop: theme.spacing(0.5),
            paddingBottom: theme.spacing(0.5)
        },
        defaultProviderBadge: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing(1),
            minHeight: 28,
            borderRadius: 9999,
            backgroundColor: theme.colors.useCases.alertSeverity.success.background
        },
        defaultProviderBadgeIcon: {
            color: theme.colors.useCases.alertSeverity.success.main
        },
        defaultProviderBadgeText: {
            color: theme.colors.useCases.alertSeverity.success.main
        },
        providerFields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            marginTop: theme.spacing(2),
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3)
        },
        errorText: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));
