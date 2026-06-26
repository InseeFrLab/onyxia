import { memo, useState } from "react";
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

export type Props = {
    className?: string;
};

type AiModel = { id: string; name: string };

type Models =
    | { stateDescription: "fetching" }
    | { stateDescription: "error" }
    | { stateDescription: "loaded"; availableModels: AiModel[] }
    | undefined;

type FormValues = {
    label: string;
    provider: string;
    apiBase: string;
    apiKey: string;
};

type FormTest =
    | { stateDescription: "idle" }
    | { stateDescription: "testing" }
    | { stateDescription: "success"; modelCount: number }
    | { stateDescription: "error" };

const AccountAiGatewayTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const {
        functions: { ai }
    } = getCoreSync();

    const { stateDescription, regionProviders, customProviders } = useCoreState(
        "ai",
        "main"
    );

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
                activeProviderId: checked ? providerId : undefined
            })
    );

    const onDeleteCustomProviderFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.deleteCustomProvider({ providerId })
    );

    // The add/edit custom-provider form is entirely UI-owned: its open state, edited
    // values and connection-test result never go through the core. The core only
    // exposes the resulting operations (add/edit/test).
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editedProviderId, setEditedProviderId] = useState<string | undefined>(
        undefined
    );
    const [values, setValues] = useState<FormValues>({
        label: "",
        provider: "openai",
        apiBase: "",
        apiKey: ""
    });
    const [test, setTest] = useState<FormTest>({ stateDescription: "idle" });

    const isEditing = editedProviderId !== undefined;
    const canSave =
        values.label !== "" &&
        values.provider !== "" &&
        values.apiBase !== "" &&
        values.apiKey !== "";
    const canTest =
        values.apiBase !== "" &&
        values.apiKey !== "" &&
        test.stateDescription !== "testing";

    const onAddClick = useConstCallback(() => {
        setEditedProviderId(undefined);
        setValues({ label: "", provider: "openai", apiBase: "", apiKey: "" });
        setTest({ stateDescription: "idle" });
        setIsFormOpen(true);
    });

    const onEditClickFactory = useCallbackFactory(([providerId]: [string]) => {
        const provider = customProviders.find(p => p.id === providerId);
        if (provider === undefined) return;
        setEditedProviderId(providerId);
        setValues({
            label: provider.label,
            provider: provider.provider,
            apiBase: provider.apiBase,
            apiKey: provider.apiKey
        });
        setTest({ stateDescription: "idle" });
        setIsFormOpen(true);
    });

    const onClose = useConstCallback(() => setIsFormOpen(false));

    const onFieldChangeFactory = useCallbackFactory(
        ([key]: [keyof FormValues], [event]: [{ target: { value: string } }]) => {
            const { value } = event.target;
            setValues(values => ({ ...values, [key]: value }));
            // Only credential changes invalidate a previous connection-test result;
            // the display label and provider type don't affect connectivity.
            if (key !== "label" && key !== "provider") {
                setTest({ stateDescription: "idle" });
            }
        }
    );

    const onTest = useConstCallback(async () => {
        setTest({ stateDescription: "testing" });
        try {
            const { modelCount } = await ai.testCustomProviderConnection({
                apiBase: values.apiBase,
                apiKey: values.apiKey
            });
            setTest({ stateDescription: "success", modelCount });
        } catch {
            setTest({ stateDescription: "error" });
        }
    });

    const onSave = useConstCallback(async () => {
        setIsFormOpen(false);
        if (editedProviderId === undefined) {
            await ai.addCustomProvider(values);
        } else {
            await ai.editCustomProvider({ providerId: editedProviderId, ...values });
        }
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

    return (
        <div className={className}>
            {regionProviders.map(regionProvider => (
                <div key={regionProvider.id} className={classes.providerCard}>
                    <div className={classes.providerCardHeader}>
                        <Text typo="label 1">{regionProvider.name}</Text>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={regionProvider.isActive}
                                    onChange={onToggleProviderFactory(regionProvider.id)}
                                    disabled={!regionProvider.canBeActivated}
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
                            <ModelsSection
                                providerId={regionProvider.id}
                                models={regionProvider.models}
                                selectedModel={regionProvider.selectedModelId}
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
                                        checked={provider.isActive}
                                        onChange={onToggleProviderFactory(provider.id)}
                                        disabled={!provider.canBeActivated}
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
                    <ModelsSection
                        providerId={provider.id}
                        models={provider.models}
                        selectedModel={provider.selectedModelId}
                    />
                </div>
            ))}

            <Dialog
                title={t(
                    isEditing
                        ? "edit custom provider title"
                        : "custom providers section title"
                )}
                isOpen={isFormOpen}
                onClose={onClose}
                body={
                    <div className={classes.addFormFields}>
                        <TextField
                            label={t("custom provider label field")}
                            value={values.label}
                            onChange={onFieldChangeFactory("label")}
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label={t("custom provider type field")}
                            value={values.provider}
                            onChange={onFieldChangeFactory("provider")}
                            size="small"
                            fullWidth
                            placeholder="openai"
                        />
                        <TextField
                            label={t("custom provider api base field")}
                            value={values.apiBase}
                            onChange={onFieldChangeFactory("apiBase")}
                            size="small"
                            fullWidth
                            placeholder="https://api.openai.com/v1"
                        />
                        <TextField
                            label={t("custom provider api key field")}
                            value={values.apiKey}
                            onChange={onFieldChangeFactory("apiKey")}
                            size="small"
                            fullWidth
                            type="password"
                        />
                        <div className={classes.testRow}>
                            <Button
                                variant="secondary"
                                onClick={onTest}
                                disabled={!canTest}
                            >
                                {test.stateDescription === "testing" ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    t("provider test")
                                )}
                            </Button>
                            {test.stateDescription === "success" && (
                                <Text typo="body 2" className={classes.testSuccess}>
                                    {t("provider test success")} ({test.modelCount})
                                </Text>
                            )}
                            {test.stateDescription === "error" && (
                                <Text typo="body 2" className={classes.errorText}>
                                    {t("provider test error")}
                                </Text>
                            )}
                        </div>
                    </div>
                }
                buttons={
                    <>
                        <Button variant="secondary" onClick={onClose}>
                            {t("provider cancel")}
                        </Button>
                        <Button onClick={onSave} disabled={!canSave}>
                            {t(isEditing ? "provider update" : "provider save")}
                        </Button>
                    </>
                }
            />
        </div>
    );
});

type ModelsSectionProps = {
    providerId: string;
    models: Models;
    selectedModel: string | undefined;
};

const ModelsSection = memo((props: ModelsSectionProps) => {
    const { providerId, models, selectedModel } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AccountAiGatewayTab });
    const {
        functions: { ai }
    } = getCoreSync();

    const onModelChange = useConstCallback((event: { target: { value: string } }) =>
        ai.setSelectedModel({ providerId, modelId: event.target.value })
    );

    if (models === undefined) {
        return null;
    }

    switch (models.stateDescription) {
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
                <ModelSelectRow
                    label={t("model label")}
                    models={models.availableModels}
                    selectedModel={selectedModel}
                    onChange={onModelChange}
                />
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
    | "gateway error"
    | "custom providers section title"
    | "custom providers section helper"
    | "edit custom provider title"
    | "custom provider label field"
    | "custom provider type field"
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
