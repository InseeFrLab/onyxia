import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useCoreState, getCoreSync } from "core";
import { getIconUrlByName } from "lazy-icons";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
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
    name: string;
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

    const onSetDefaultProviderFactory = useCallbackFactory(([providerId]: [string]) =>
        ai.setActiveProvider({
            activeProviderId: providerId
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
        name: "",
        provider: "openai",
        apiBase: "",
        apiKey: ""
    });
    const [test, setTest] = useState<FormTest>({ stateDescription: "idle" });

    const isEditing = editedProviderId !== undefined;
    const canSave =
        values.name !== "" &&
        values.provider !== "" &&
        values.apiBase !== "" &&
        values.apiKey !== "";
    const canTest =
        values.apiBase !== "" &&
        values.apiKey !== "" &&
        test.stateDescription !== "testing";

    const onAddClick = useConstCallback(() => {
        setEditedProviderId(undefined);
        setValues({ name: "", provider: "openai", apiBase: "", apiKey: "" });
        setTest({ stateDescription: "idle" });
        setIsFormOpen(true);
    });

    const onEditClickFactory = useCallbackFactory(([providerId]: [string]) => {
        const provider = customProviders.find(p => p.id === providerId);
        if (provider === undefined) return;
        setEditedProviderId(providerId);
        setValues({
            name: provider.name,
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
            if (key !== "name" && key !== "provider") {
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
                            value={values.name}
                            onChange={onFieldChangeFactory("name")}
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

type ProviderValueFieldProps = {
    label: string;
    value: string;
    onRequestCopy: () => void;
    isSensitiveInformation?: boolean;
};

const ProviderValueField = memo((props: ProviderValueFieldProps) => {
    const { label, value, onRequestCopy, isSensitiveInformation = false } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AccountAiGatewayTab });
    const [isHidden, setIsHidden] = useState(isSensitiveInformation);

    const onToggleHidden = useConstCallback(() => setIsHidden(isHidden => !isHidden));

    return (
        <div className={classes.providerField}>
            <Text typo="label 1">{label}</Text>
            <div className={classes.codeFrame}>
                <Text typo="body 1" className={classes.codeFrameValue}>
                    {isHidden ? "•".repeat(Math.max(value.length, 30)) : value}
                </Text>
                {isSensitiveInformation && (
                    <IconButton
                        icon={getIconUrlByName(isHidden ? "Visibility" : "VisibilityOff")}
                        onClick={onToggleHidden}
                        size="small"
                    />
                )}
                <Button
                    variant="secondary"
                    startIcon={getIconUrlByName("ContentCopy")}
                    onClick={onRequestCopy}
                    className={classes.codeFrameButton}
                >
                    {t("copy")}
                </Button>
            </div>
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
    const { t } = useTranslation({ AccountAiGatewayTab });

    return (
        <div className={classes.providerField}>
            <Text typo="label 1">{label}</Text>
            <div className={classes.codeFrame}>
                <Select
                    value={selectedModel ?? ""}
                    onChange={onChange}
                    size="small"
                    className={classes.modelSelect}
                    displayEmpty
                >
                    <MenuItem value="" disabled>
                        {t("not defined")}
                    </MenuItem>
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
    | "default provider"
    | "set default provider"
    | "refresh credentials"
    | "delete provider"
    | "edit provider"
    | "copy"
    | "not defined"
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
    providerField: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    codeFrame: {
        minHeight: 45,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        padding: `${theme.spacing(1)}px ${theme.spacing(1.5)}px`,
        borderRadius: theme.spacing(1),
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        minWidth: 0
    },
    codeFrameValue: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontFamily: "monospace"
    },
    codeFrameButton: {
        minHeight: 28,
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
        flexShrink: 0
    },
    modelSelect: {
        flex: 1,
        minWidth: 0,
        "& .MuiOutlinedInput-notchedOutline": {
            border: "none"
        },
        "& .MuiSelect-select": {
            paddingLeft: 0
        }
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
