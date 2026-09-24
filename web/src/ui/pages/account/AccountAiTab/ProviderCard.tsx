import { getIconUrlByName } from "lazy-icons";
import {
    breakpointsValues,
    type ThemedAssetUrl,
    useResolveThemedAssetUrl
} from "onyxia-ui";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { ModelsSelection } from "./shared/ModelsSelection";

import type { ProviderConnectionState } from "core/usecases/aiProvidersManagements";

export type ProviderState = ProviderConnectionState;

type Props = {
    className?: string;
    name: string;
    subtitle: string;
    state: ProviderState;
    modelSelector: {
        isDisabled: boolean;
        models: string[];
        selectedModels: string[];
        onSelectedModelsChange: (models: string[]) => void;
    };
    manageLabel: string;
    onManage: () => void;
    /** Nothing is displayed in place of the logo when undefined */
    logoUrl?: ThemedAssetUrl;
};

export function ProviderCard(props: Props) {
    const {
        className,
        name,
        subtitle,
        state,
        modelSelector,
        manageLabel,
        onManage,
        logoUrl
    } = props;

    const { classes, cx } = useStyles();
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.summary}>
                <div className={classes.header}>
                    {logoUrl !== undefined && (
                        <img
                            className={classes.logo}
                            src={resolveThemedAssetUrl(logoUrl)}
                            alt=""
                        />
                    )}
                    <div className={classes.identity}>
                        <Text
                            className={classes.ellipsis}
                            typo="object heading"
                            htmlComponent="h3"
                        >
                            {name}
                        </Text>
                        <Text
                            className={classes.ellipsis}
                            typo="body 1"
                            color="secondary"
                        >
                            {subtitle}
                        </Text>
                    </div>
                    <ProviderStateChip state={state} />
                </div>
                <div className={classes.footer}>
                    <ModelsSelection
                        className={classes.modelSelector}
                        models={modelSelector.models}
                        selectedModels={modelSelector.selectedModels}
                        disabled={modelSelector.isDisabled}
                        onSelectedModelsChange={modelSelector.onSelectedModelsChange}
                    />
                    <Button
                        className={classes.manageButton}
                        variant="ternary"
                        startIcon={getIconUrlByName("Settings")}
                        onClick={onManage}
                    >
                        {manageLabel}
                    </Button>
                </div>
            </div>
        </section>
    );
}

const useStyles = tss.withName({ ProviderCard }).create(({ theme }) => ({
    root: {
        boxSizing: "border-box",
        padding: theme.spacing(4),
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        borderRadius: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface1
    },
    summary: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: theme.spacing(4)
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2.5),
        minWidth: 0
    },
    logo: {
        width: 48,
        height: 48,
        flexShrink: 0,
        objectFit: "cover",
        borderRadius: theme.spacing(2.5)
    },
    identity: {
        flex: 1,
        minWidth: 0
    },
    ellipsis: {
        margin: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    footer: {
        display: "flex",
        alignItems: "flex-end",
        gap: theme.spacing(2),
        [`@media (max-width: ${breakpointsValues.sm}px)`]: {
            alignItems: "stretch",
            flexDirection: "column"
        }
    },
    modelSelector: {
        flex: 1,
        minWidth: 0
    },
    manageButton: {
        flexShrink: 0,
        [`@media (max-width: ${breakpointsValues.sm}px)`]: {
            alignSelf: "flex-end"
        }
    }
}));

export function ProviderStateChip(props: { className?: string; state: ProviderState }) {
    const { className, state } = props;

    const { classes, cx } = useStyles_ProviderStateChip();
    const { t } = useTranslation({ ProviderCard });

    const stateLabel: Record<ProviderState, string> = {
        connected: t("connected"),
        "setup required": t("setup required"),
        "connection error": t("connection error")
    };

    return (
        <div
            className={cx(
                classes.status,
                state === "connected" && classes.statusConnected,
                state === "setup required" && classes.statusSetupRequired,
                state === "connection error" && classes.statusConnectionError,
                className
            )}
        >
            <span
                className={cx(
                    classes.statusDot,
                    state === "connected" && classes.statusDotConnected,
                    state === "setup required" && classes.statusDotSetupRequired,
                    state === "connection error" && classes.statusDotConnectionError
                )}
            />
            <Text className={classes.statusLabel} typo="label 2" htmlComponent="span">
                {stateLabel[state]}
            </Text>
        </div>
    );
}

const useStyles_ProviderStateChip = tss
    .withName({ ProviderStateChip })
    .create(({ theme }) => ({
        status: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexShrink: 0,
            padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`,
            borderRadius: 100,
            color: theme.colors.useCases.typography.textPrimary
        },
        statusConnected: {
            backgroundColor: theme.colors.useCases.alertSeverity.success.background
        },
        statusSetupRequired: {
            backgroundColor: theme.colors.useCases.alertSeverity.warning.background
        },
        statusConnectionError: {
            backgroundColor: theme.colors.useCases.alertSeverity.error.background
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: "50%"
        },
        statusDotConnected: {
            backgroundColor: theme.colors.useCases.alertSeverity.success.main
        },
        statusDotSetupRequired: {
            backgroundColor: theme.colors.useCases.alertSeverity.warning.main
        },
        statusDotConnectionError: {
            backgroundColor: theme.colors.useCases.alertSeverity.error.main
        },
        statusLabel: {
            whiteSpace: "nowrap",
            [`@media (max-width: ${breakpointsValues.sm}px)`]: {
                display: "none"
            }
        }
    }));

const { i18n } = declareComponentKeys<
    "connected" | "setup required" | "connection error"
>()({ ProviderCard });
export type I18n = typeof i18n;
