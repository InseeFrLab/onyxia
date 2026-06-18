import { useEffect, memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useCoreState, getCoreSync } from "core";
import { smartTrim } from "ui/tools/smartTrim";
import { getIconUrlByName } from "lazy-icons";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Text } from "onyxia-ui/Text";
import type {
    AiModel,
    ModelCatalog,
    ModelSelection,
    Provider
} from "core/usecases/ai/state";

export type Props = {
    className?: string;
};

const AccountAiGatewayTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const {
        functions: { ai }
    } = getCoreSync();

    const uiState = useCoreState("ai", "main");

    useEffect(() => {
        if (!uiState.isInitialized) return;

        uiState.providers.forEach(provider => {
            if (
                provider.kind === "region" &&
                provider.auth.stateDescription === "authenticated" &&
                provider.auth.token === undefined
            ) {
                ai.refreshToken({ providerId: provider.id });
            }
        });
    }, []);

    const { t } = useTranslation({ AccountAiGatewayTab });

    const onFieldRequestCopyFactory = useCallbackFactory(([text]: [string]) =>
        copyToClipboard(text)
    );

    const onRefreshClickFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.refreshToken({ providerId })
    );

    const onToggleProviderFactory = useCallbackFactory(
        ([providerId]: [string], [, checked]: [unknown, boolean]) =>
            ai.setActiveProvider({
                activeProvider: checked
                    ? { kind: "provider", providerId }
                    : { kind: "none" }
            })
    );

    const onDeleteCustomProviderFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.deleteCustomProvider({ providerId })
    );

    const [addFormOpen, setAddFormOpen] = useState(false);
    const [editingProviderId, setEditingProviderId] = useState<string | undefined>(
        undefined
    );
    const [pendingLabel, setPendingLabel] = useState("");
    const [pendingApiBase, setPendingApiBase] = useState("");
    const [pendingApiKey, setPendingApiKey] = useState("");
    const [testStatus, setTestStatus] = useState<
        "idle" | "testing" | "success" | "error"
    >("idle");
    const [testModelCount, setTestModelCount] = useState(0);

    const onAddClick = useConstCallback(() => {
        setEditingProviderId(undefined);
        setPendingLabel("");
        setPendingApiBase("");
        setPendingApiKey("");
        setTestStatus("idle");
        setTestModelCount(0);
        setAddFormOpen(true);
    });

    const onEditClickFactory = useCallbackFactory(([providerId]: [string]) => {
        if (!uiState.isInitialized) return;

        const provider = uiState.providers.find(
            (p): p is Provider.Custom => p.kind === "custom" && p.id === providerId
        );
        if (provider === undefined) return;

        setEditingProviderId(providerId);
        setPendingLabel(provider.label);
        setPendingApiBase(provider.apiBase);
        setPendingApiKey(provider.apiKey);
        setTestStatus("idle");
        setTestModelCount(0);
        setAddFormOpen(true);
    });

    const onCancelAdd = useConstCallback(() => {
        setAddFormOpen(false);
        setEditingProviderId(undefined);
        setPendingLabel("");
        setPendingApiBase("");
        setPendingApiKey("");
        setTestStatus("idle");
        setTestModelCount(0);
    });

    const onTestProvider = useConstCallback(async () => {
        setTestStatus("testing");
        try {
            const models = await ai.testCustomProvider({
                apiBase: pendingApiBase,
                apiKey: pendingApiKey
            });
            setTestModelCount(models.length);
            setTestStatus("success");
        } catch {
            setTestStatus("error");
        }
    });

    const onSaveProvider = useConstCallback(async () => {
        if (editingProviderId === undefined) {
            await ai.addCustomProvider({
                label: pendingLabel,
                apiBase: pendingApiBase,
                apiKey: pendingApiKey
            });
        } else {
            await ai.editCustomProvider({
                providerId: editingProviderId,
                label: pendingLabel,
                apiBase: pendingApiBase,
                apiKey: pendingApiKey
            });
        }
        setAddFormOpen(false);
        setEditingProviderId(undefined);
        setPendingLabel("");
        setPendingApiBase("");
        setPendingApiKey("");
        setTestStatus("idle");
        setTestModelCount(0);
    });

    if (!uiState.isInitialized) {
        return uiState.isInitializing ? <CircularProgress /> : null;
    }

    const { providers, activeProvider } = uiState;

    const regionProviders = providers.filter(
        (p): p is Provider.Region => p.kind === "region"
    );
    const customProviders = providers.filter(
        (p): p is Provider.Custom => p.kind === "custom"
    );

    const isActive = (providerId: string) =>
        activeProvider.kind === "provider" && activeProvider.providerId === providerId;

    return (
        <div className={className}>
            {regionProviders.map(regionProvider => (
                <div key={regionProvider.id} className={classes.providerCard}>
                    <div className={classes.providerCardHeader}>
                        <Text typo="label 1">{regionProvider.name}</Text>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isActive(regionProvider.id)}
                                    onChange={onToggleProviderFactory(regionProvider.id)}
                                    disabled={
                                        regionProvider.modelCatalog.stateDescription !==
                                        "loaded"
                                    }
                                    size="small"
                                />
                            }
                            label={<Text typo="body 2">{t("use in services")}</Text>}
                        />
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
                                helperText={
                                    <>
                                        {t("credentials section helper", {
                                            webUiUrl: regionProvider.webUiUrl
                                        })}
                                        &nbsp;
                                        <IconButton
                                            size="extra small"
                                            icon={getIconUrlByName("Refresh")}
                                            onClick={onRefreshClickFactory(
                                                regionProvider.id
                                            )}
                                        />
                                    </>
                                }
                            />
                            {regionProvider.auth.token === undefined ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <SettingField
                                        type="text"
                                        title={t("api base url")}
                                        text={smartTrim({
                                            maxLength: 60,
                                            minCharAtTheEnd: 20,
                                            text: regionProvider.apiBase
                                        })}
                                        onRequestCopy={onFieldRequestCopyFactory(
                                            regionProvider.apiBase
                                        )}
                                        isSensitiveInformation={false}
                                    />
                                    <SettingField
                                        type="text"
                                        title={t("token")}
                                        text={smartTrim({
                                            maxLength: 50,
                                            minCharAtTheEnd: 20,
                                            text: regionProvider.auth.token
                                        })}
                                        onRequestCopy={onFieldRequestCopyFactory(
                                            regionProvider.auth.token
                                        )}
                                        isSensitiveInformation={true}
                                    />
                                </>
                            )}
                            <ModelCatalogSection
                                providerId={regionProvider.id}
                                modelCatalog={regionProvider.modelCatalog}
                                selection={regionProvider.selection}
                            />
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
                        <Text typo="label 1">{provider.label}</Text>
                        <div className={classes.providerCardActions}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isActive(provider.id)}
                                        onChange={onToggleProviderFactory(provider.id)}
                                        disabled={
                                            provider.modelCatalog.stateDescription !==
                                            "loaded"
                                        }
                                        size="small"
                                    />
                                }
                                label={<Text typo="body 2">{t("use in services")}</Text>}
                            />
                            <IconButton
                                icon={getIconUrlByName("Edit")}
                                onClick={onEditClickFactory(provider.id)}
                                size="small"
                            />
                            <IconButton
                                icon={getIconUrlByName("Delete")}
                                onClick={onDeleteCustomProviderFactory(provider.id)}
                                size="small"
                            />
                        </div>
                    </div>
                    <SettingField
                        type="text"
                        title={t("custom provider api base field")}
                        text={smartTrim({
                            maxLength: 60,
                            minCharAtTheEnd: 20,
                            text: provider.apiBase
                        })}
                        onRequestCopy={onFieldRequestCopyFactory(provider.apiBase)}
                        isSensitiveInformation={false}
                    />
                    <SettingField
                        type="text"
                        title={t("custom provider api key field")}
                        text={smartTrim({
                            maxLength: 50,
                            minCharAtTheEnd: 20,
                            text: provider.apiKey
                        })}
                        onRequestCopy={onFieldRequestCopyFactory(provider.apiKey)}
                        isSensitiveInformation={true}
                    />
                    <ModelCatalogSection
                        providerId={provider.id}
                        modelCatalog={provider.modelCatalog}
                        selection={provider.selection}
                    />
                </div>
            ))}

            <Dialog
                title={t(
                    editingProviderId === undefined
                        ? "custom providers section title"
                        : "edit custom provider title"
                )}
                isOpen={addFormOpen}
                onClose={onCancelAdd}
                body={
                    <div className={classes.addFormFields}>
                        <TextField
                            label={t("custom provider label field")}
                            value={pendingLabel}
                            onChange={e => setPendingLabel(e.target.value)}
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label={t("custom provider api base field")}
                            value={pendingApiBase}
                            onChange={e => {
                                setPendingApiBase(e.target.value);
                                setTestStatus("idle");
                            }}
                            size="small"
                            fullWidth
                            placeholder="https://api.openai.com/v1"
                        />
                        <TextField
                            label={t("custom provider api key field")}
                            value={pendingApiKey}
                            onChange={e => {
                                setPendingApiKey(e.target.value);
                                setTestStatus("idle");
                            }}
                            size="small"
                            fullWidth
                            type="password"
                        />
                        <div className={classes.testRow}>
                            <Button
                                variant="secondary"
                                onClick={onTestProvider}
                                disabled={
                                    pendingApiBase === "" ||
                                    pendingApiKey === "" ||
                                    testStatus === "testing"
                                }
                            >
                                {testStatus === "testing" ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    t("provider test")
                                )}
                            </Button>
                            {testStatus === "success" && (
                                <Text typo="body 2" className={classes.testSuccess}>
                                    {t("provider test success")} ({testModelCount})
                                </Text>
                            )}
                            {testStatus === "error" && (
                                <Text typo="body 2" className={classes.errorText}>
                                    {t("provider test error")}
                                </Text>
                            )}
                        </div>
                    </div>
                }
                buttons={
                    <>
                        <Button variant="secondary" onClick={onCancelAdd}>
                            {t("provider cancel")}
                        </Button>
                        <Button
                            onClick={onSaveProvider}
                            disabled={
                                pendingLabel === "" ||
                                pendingApiBase === "" ||
                                pendingApiKey === ""
                            }
                        >
                            {t(
                                editingProviderId === undefined
                                    ? "provider save"
                                    : "provider update"
                            )}
                        </Button>
                    </>
                }
            />
        </div>
    );
});

type ModelCatalogSectionProps = {
    providerId: string;
    modelCatalog: ModelCatalog;
    selection: ModelSelection;
};

const ModelCatalogSection = memo((props: ModelCatalogSectionProps) => {
    const { providerId, modelCatalog, selection } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AccountAiGatewayTab });
    const {
        functions: { ai }
    } = getCoreSync();

    const onModelChange = useConstCallback((event: { target: { value: string } }) =>
        ai.setSelectedModel({ providerId, modelId: event.target.value })
    );

    const onEmbeddingsModelChange = useConstCallback(
        (event: { target: { value: string } }) =>
            ai.setSelectedEmbeddingsModel({ providerId, modelId: event.target.value })
    );

    switch (modelCatalog.stateDescription) {
        case "not fetched":
            return null;
        case "fetching":
            return <CircularProgress size={20} />;
        case "error":
            return (
                <Text typo="body 2" className={classes.errorText}>
                    {t("models fetch error")}
                </Text>
            );
        case "loaded":
            return (
                <>
                    <ModelSelectRow
                        label={t("model label")}
                        models={modelCatalog.availableModels}
                        selectedModel={selection.modelId}
                        onChange={onModelChange}
                    />
                    <ModelSelectRow
                        label={t("embeddings model label")}
                        models={modelCatalog.availableModels}
                        selectedModel={selection.embeddingsModelId}
                        onChange={onEmbeddingsModelChange}
                    />
                </>
            );
    }
});

type ModelSelectRowProps = {
    label: string;
    models: AiModel[];
    selectedModel: string | undefined;
    onChange: (event: { target: { value: string } }) => void;
};

const ModelSelectRow = memo((props: ModelSelectRowProps) => {
    const { label, models, selectedModel, onChange } = props;

    const { classes } = useStyles();

    return (
        <div className={classes.modelRow}>
            <div className={classes.modelRowTitle}>
                <Text typo="label 1">{label}</Text>
            </div>
            <div className={classes.modelRowControl}>
                <Select value={selectedModel ?? ""} onChange={onChange} size="small">
                    {models.map(({ id, name }) => (
                        <MenuItem key={id} value={id}>
                            {name}
                        </MenuItem>
                    ))}
                </Select>
            </div>
        </div>
    );
});

export default AccountAiGatewayTab;

const { i18n } = declareComponentKeys<
    | "use in services"
    | "credentials section title"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "token"
    | "model label"
    | "embeddings model label"
    | "gateway error"
    | "custom providers section title"
    | "custom providers section helper"
    | "edit custom provider title"
    | "custom provider label field"
    | "custom provider api base field"
    | "custom provider api key field"
    | "provider test"
    | "provider test success"
    | "provider test error"
    | "provider save"
    | "provider update"
    | "provider cancel"
    | "models fetch error"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiGatewayTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountAiGatewayTab }).create(({ theme }) => ({
    modelRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(3)
    },
    modelRowTitle: {
        width: 360,
        display: "flex",
        alignItems: "center"
    },
    modelRowControl: {
        flex: 1,
        display: "flex",
        alignItems: "center"
    },
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
        gap: theme.spacing(2)
    },
    errorText: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    addFormFields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    testRow: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3)
    },
    testSuccess: {
        color: theme.colors.useCases.alertSeverity.success.main
    }
}));
