import { useEffect, useState } from "react";
import { Alert, Link, MenuItem, Select } from "@mui/material";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useResolveLocalizedString, useTranslation } from "ui/i18n";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { ModelsSelection } from "../../shared/ModelsSelection";
import { ProviderValueField } from "./ProviderValueField";
import { SideDialog } from "../../shared/SideDialog";

export type ManagedProvider = {
    name: string;
    subtitle: string;
    apiBase: string;
    apiKey: string | undefined;
    isApiKeyEditable: boolean;
    availableModels: string[] | undefined;
    selectedModelIds: string[];
    isModelSelectionDisabled: boolean;
    connectionError: string | undefined;
    canRefreshCredentials: boolean;
    isRefreshingCredentials: boolean;
    canEdit: boolean;
    canDelete: boolean;
    /** Written by the admin in the instance configuration */
    documentation: AiConfig.Documentation | undefined;
};

export function ManageProvidersDialog(props: {
    initialProviderName: string;
    providers: ManagedProvider[];
    onClose: () => void;
    onRefreshCredentials: (providerName: string) => void | Promise<void>;
    onTestConnection: (providerName: string) => void | Promise<void>;
    onEdit: (providerName: string) => void;
    onDelete: (providerName: string) => void | Promise<void>;
    onSaveModels: (params: {
        providerName: string;
        modelIds: string[];
    }) => void | Promise<void>;
    onSaveApiKey: (params: {
        providerName: string;
        apiKey: string;
    }) => void | Promise<void>;
}) {
    const { t } = useTranslation({ ManageProvidersDialog });
    const { classes, cx } = useStyles();
    const { resolveLocalizedString } = useResolveLocalizedString();
    const [providerName, setProviderName] = useState(props.initialProviderName);
    const provider =
        props.providers.find(provider => provider.name === providerName) ??
        props.providers[0];
    const [selectedModelIds, setSelectedModelIds] = useState(
        provider?.selectedModelIds ?? []
    );
    const [apiKey, setApiKey] = useState(provider?.apiKey ?? "");

    useEffect(() => {
        if (provider === undefined) {
            return;
        }

        setSelectedModelIds(provider.selectedModelIds);
        setApiKey(provider.apiKey ?? "");
    }, [provider?.name]);

    if (provider === undefined) {
        return null;
    }

    const onClose = props.onClose;

    return (
        <SideDialog
            title={t("dialog title")}
            closeLabel={t("close aria label")}
            onClose={onClose}
        >
            <div className={classes.root}>
                <div className={classes.providerHeader}>
                    <Select
                        className={classes.providerSelect}
                        value={provider.name}
                        variant="standard"
                        disableUnderline
                        inputProps={{ "aria-label": t("provider selector aria label") }}
                        onChange={event => setProviderName(event.target.value)}
                    >
                        {props.providers.map(provider => (
                            <MenuItem key={provider.name} value={provider.name}>
                                {provider.name}
                            </MenuItem>
                        ))}
                    </Select>
                    <Text typo="body 1" className={classes.providerSubtitle}>
                        {provider.subtitle}
                    </Text>
                </div>

                <div className={classes.scrollableContent}>
                    <section className={classes.section}>
                        <div className={classes.sectionHeading}>
                            <Text typo="section heading">
                                {t("connection details title")}
                            </Text>
                            <Text typo="body 1" className={classes.sectionHelper}>
                                {t("connection details helper")}
                            </Text>
                        </div>
                        <div className={classes.fields}>
                            <ProviderValueField
                                label={t("api base url")}
                                value={provider.apiBase}
                                onRequestCopy={() => copyToClipboard(provider.apiBase)}
                            />
                            {(provider.apiKey !== undefined ||
                                provider.isApiKeyEditable) && (
                                <ProviderValueField
                                    label={t("api key")}
                                    value={apiKey}
                                    isSensitiveInformation
                                    onChange={
                                        provider.isApiKeyEditable ? setApiKey : undefined
                                    }
                                    disabled={provider.isRefreshingCredentials}
                                    onRequestCopy={() => copyToClipboard(apiKey)}
                                />
                            )}
                        </div>
                        {provider.connectionError !== undefined && (
                            <Alert severity="warning">{provider.connectionError}</Alert>
                        )}
                        <div className={classes.sectionActions}>
                            {provider.canEdit && (
                                <Button
                                    variant="secondary"
                                    startIcon={getIconUrlByName("Settings")}
                                    onClick={() => props.onEdit(provider.name)}
                                >
                                    {t("edit provider")}
                                </Button>
                            )}
                            {provider.canDelete && (
                                <Button
                                    variant="ternary"
                                    onClick={() => props.onDelete(provider.name)}
                                >
                                    {t("delete provider")}
                                </Button>
                            )}
                            {/* NOTE: Only for the OIDC token exchange authentication */}
                            {provider.canRefreshCredentials && (
                                <Button
                                    variant="ternary"
                                    className={classes.refreshCredentialsButton}
                                    startIcon={getIconUrlByName("Refresh")}
                                    disabled={provider.isRefreshingCredentials}
                                    onClick={() =>
                                        props.onRefreshCredentials(provider.name)
                                    }
                                >
                                    {t("refresh credentials")}
                                </Button>
                            )}
                            <Button
                                variant="ternary"
                                className={classes.testConnectionButton}
                                startIcon={getIconUrlByName("NetworkCheck")}
                                disabled={provider.isRefreshingCredentials}
                                onClick={() => props.onTestConnection(provider.name)}
                            >
                                {t("test connection")}
                            </Button>
                        </div>
                    </section>

                    <section className={classes.section}>
                        <div className={classes.sectionHeading}>
                            <Text typo="section heading">{t("manage models title")}</Text>
                            <Text typo="body 1" className={classes.sectionHelper}>
                                {t("manage models helper")}
                            </Text>
                        </div>
                        <ModelsSelection
                            models={provider.availableModels ?? []}
                            selectedModels={selectedModelIds}
                            disabled={provider.isModelSelectionDisabled}
                            onSelectedModelsChange={setSelectedModelIds}
                        />
                    </section>
                    {provider.documentation !== undefined && (
                        <section
                            className={cx(classes.section, classes.documentationSection)}
                        >
                            <div className={classes.sectionHeading}>
                                <Text typo="section heading">
                                    {t("documentation title")}
                                </Text>
                                <Text typo="body 1" className={classes.sectionHelper}>
                                    {resolveLocalizedString(
                                        provider.documentation.mainText
                                    )}
                                </Text>
                            </div>
                            {provider.documentation.links.length !== 0 && (
                                <div className={classes.documentationLinks}>
                                    {provider.documentation.links.map(link => (
                                        <Link
                                            key={link.url}
                                            className={classes.documentationLink}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            underline="none"
                                        >
                                            <span
                                                className={classes.documentationLinkLabel}
                                            >
                                                {resolveLocalizedString(link.label)}
                                            </span>
                                            <Icon
                                                icon={getIconUrlByName("OpenInNew")}
                                                size="extra small"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className={classes.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={
                            provider.isRefreshingCredentials ||
                            (provider.availableModels !== undefined &&
                                provider.isModelSelectionDisabled)
                        }
                        onClick={async () => {
                            if (provider.isApiKeyEditable) {
                                await props.onSaveApiKey({
                                    providerName: provider.name,
                                    apiKey
                                });
                            }
                            if (provider.availableModels !== undefined) {
                                await props.onSaveModels({
                                    providerName: provider.name,
                                    modelIds: selectedModelIds
                                });
                            }
                            onClose();
                        }}
                    >
                        {t("save changes")}
                    </Button>
                </div>
            </div>
        </SideDialog>
    );
}

const useStyles = tss.withName({ ManageProvidersDialog }).create(({ theme }) => ({
    root: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column"
    },
    providerHeader: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        paddingBottom: theme.spacing(3),
        "@media (max-width: 600px)": {
            alignItems: "flex-start",
            flexDirection: "column"
        }
    },
    providerSelect: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary,
        ...theme.typography.variants["section heading"].style,
        "& .MuiSelect-select": {
            padding: 0,
            paddingRight: `${theme.spacing(4)}px !important`
        }
    },
    providerSubtitle: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        color: theme.colors.useCases.typography.textSecondary,
        textAlign: "right",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        "@media (max-width: 600px)": {
            textAlign: "left"
        }
    },
    scrollableContent: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        overflowY: "auto",
        paddingBottom: theme.spacing(3)
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    sectionHeading: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    sectionHelper: {
        color: theme.colors.useCases.typography.textSecondary
    },
    documentationSection: {
        paddingTop: theme.spacing(4),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    documentationLinks: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.spacing(2)
    },
    documentationLink: {
        maxWidth: 350,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        borderRadius: theme.spacing(1),
        backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
        color: theme.colors.useCases.typography.textFocus,
        ...theme.typography.variants["caption"].style,
        fontWeight: 500,
        "& svg, & img": {
            flexShrink: 0
        }
    },
    documentationLinkLabel: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    sectionActions: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: theme.spacing(2)
    },
    refreshCredentialsButton: {
        borderWidth: 0,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary
    },
    // Figma's `surface-action-secondary`: the inverse of the current surface
    testConnectionButton: {
        borderWidth: 0,
        backgroundColor: theme.colors.useCases.typography.textPrimary,
        color: theme.colors.useCases.surfaces.background,
        "&:hover": {
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.useCases.surfaces.background
        },
        "&.Mui-disabled": {
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.useCases.surfaces.background,
            opacity: 0.3
        }
    },
    footer: {
        flex: "none",
        display: "flex",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface3}`
    }
}));

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "close aria label"
    | "provider selector aria label"
    | "documentation title"
    | "connection details title"
    | "connection details helper"
    | "manage models title"
    | "manage models helper"
    | "api base url"
    | "api key"
    | "refresh credentials"
    | "test connection"
    | "edit provider"
    | "delete provider"
    | "cancel"
    | "save changes"
>()({ ManageProvidersDialog });
export type I18n = typeof i18n;
