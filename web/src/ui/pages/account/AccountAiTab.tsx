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
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Text } from "onyxia-ui/Text";
import type { CustomAiProvider } from "core/usecases/ai/state";

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
        if (uiState.isEnabled && uiState.token === undefined) {
            ai.refreshToken();
        }
    }, []);

    const { t } = useTranslation({ AccountAiGatewayTab });

    const onFieldRequestCopyFactory = useCallbackFactory(([text]: [string]) =>
        copyToClipboard(text)
    );

    const onRefreshClick = useConstCallback(() => ai.refreshToken());

    const onModelChange = useConstCallback((event: { target: { value: string } }) =>
        ai.setSelectedModel({ model: event.target.value })
    );

    const onCustomProviderModelChangeFactory = useCallbackFactory(
        ([id]: [string], [event]: [{ target: { value: string } }]) =>
            ai.setCustomProviderSelectedModel({ id, model: event.target.value })
    );

    const onDeleteCustomProviderFactory = useCallbackFactory(([id]: [string]) =>
        ai.deleteCustomProvider({ id })
    );

    const [addFormOpen, setAddFormOpen] = useState(false);
    const [pendingLabel, setPendingLabel] = useState("");
    const [pendingApiBase, setPendingApiBase] = useState("");
    const [pendingApiKey, setPendingApiKey] = useState("");
    const [testStatus, setTestStatus] = useState<
        "idle" | "testing" | "success" | "error"
    >("idle");
    const [testModelCount, setTestModelCount] = useState(0);

    const onAddClick = useConstCallback(() => setAddFormOpen(true));

    const onCancelAdd = useConstCallback(() => {
        setAddFormOpen(false);
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
        await ai.addCustomProvider({
            label: pendingLabel,
            apiBase: pendingApiBase,
            apiKey: pendingApiKey
        });
        setAddFormOpen(false);
        setPendingLabel("");
        setPendingApiBase("");
        setPendingApiKey("");
        setTestStatus("idle");
        setTestModelCount(0);
    });

    if (!uiState.isEnabled) {
        const { initializationStatus } = uiState;

        if (initializationStatus === "pending") {
            return <CircularProgress />;
        }

        if (
            initializationStatus === "no-account" &&
            "webUiUrl" in uiState &&
            uiState.webUiUrl !== undefined
        ) {
            return (
                <Text typo="body 1">
                    {t("no account", { webUiUrl: uiState.webUiUrl })}
                </Text>
            );
        }

        return null;
    }

    if (uiState.token === undefined) {
        return <CircularProgress />;
    }

    const { token, apiBase, webUiUrl, availableModels, selectedModel, customProviders } =
        uiState;

    return (
        <div className={className}>
            <SettingSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper", { webUiUrl })}
                        &nbsp;
                        <IconButton
                            size="extra small"
                            icon={getIconUrlByName("Refresh")}
                            onClick={onRefreshClick}
                        />
                    </>
                }
            />
            <SettingField
                type="text"
                title={t("api base url")}
                text={smartTrim({ maxLength: 60, minCharAtTheEnd: 20, text: apiBase })}
                onRequestCopy={onFieldRequestCopyFactory(apiBase)}
                isSensitiveInformation={false}
            />
            <SettingField
                type="text"
                title={t("token")}
                text={smartTrim({ maxLength: 50, minCharAtTheEnd: 20, text: token })}
                onRequestCopy={onFieldRequestCopyFactory(token)}
                isSensitiveInformation={true}
            />
            <div className={classes.modelRow}>
                <div className={classes.modelRowTitle}>
                    <Text typo="label 1">{t("model label")}</Text>
                </div>
                <div className={classes.modelRowControl}>
                    <Select
                        value={selectedModel ?? ""}
                        onChange={onModelChange}
                        size="small"
                    >
                        {availableModels.map(({ id, name }) => (
                            <MenuItem key={id} value={id}>
                                {name}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
            </div>

            <Divider className={classes.divider} variant="middle" />

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
                <CustomProviderCard
                    key={provider.id}
                    provider={provider}
                    onModelChange={onCustomProviderModelChangeFactory(provider.id)}
                    onDelete={onDeleteCustomProviderFactory(provider.id)}
                    modelLabel={t("model label")}
                    modelsErrorLabel={t("models fetch error")}
                />
            ))}

            <Dialog
                title={t("custom providers section title")}
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
                                <Text typo="body 2" className={classes.testError}>
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
                            {t("provider save")}
                        </Button>
                    </>
                }
            />
        </div>
    );
});

type CustomProviderCardProps = {
    provider: CustomAiProvider;
    onModelChange: (event: { target: { value: string } }) => void;
    onDelete: () => void;
    modelLabel: string;
    modelsErrorLabel: string;
};

const CustomProviderCard = memo((props: CustomProviderCardProps) => {
    const { provider, onModelChange, onDelete, modelLabel, modelsErrorLabel } = props;

    const { classes } = useStyles();

    return (
        <div className={classes.providerCard}>
            <div className={classes.providerCardHeader}>
                <Text typo="label 1">{provider.label}</Text>
                <IconButton
                    icon={getIconUrlByName("Delete")}
                    onClick={onDelete}
                    size="small"
                />
            </div>
            <div className={classes.modelRow}>
                <div className={classes.modelRowTitle}>
                    <Text typo="label 1">{modelLabel}</Text>
                </div>
                <div className={classes.modelRowControl}>
                    {provider.modelsFetchStatus === "fetching" && (
                        <CircularProgress size={20} />
                    )}
                    {provider.modelsFetchStatus === "error" && (
                        <Text typo="body 2" className={classes.modelsError}>
                            {modelsErrorLabel}
                        </Text>
                    )}
                    {provider.modelsFetchStatus === "success" &&
                        provider.availableModels.length > 0 && (
                            <Select
                                value={provider.selectedModel ?? ""}
                                onChange={onModelChange}
                                size="small"
                            >
                                {provider.availableModels.map(({ id, name }) => (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                </div>
            </div>
        </div>
    );
});

export default AccountAiGatewayTab;

const { i18n } = declareComponentKeys<
    | "credentials section title"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "token"
    | "model label"
    | "custom providers section title"
    | "custom providers section helper"
    | "custom provider label field"
    | "custom provider api base field"
    | "custom provider api key field"
    | "provider test"
    | "provider test success"
    | "provider test error"
    | "provider save"
    | "provider cancel"
    | "models fetch error"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiGatewayTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountAiGatewayTab }).create(({ theme }) => ({
    divider: {
        ...theme.spacing.topBottom("margin", 4)
    },
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
        gap: theme.spacing(1)
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
    modelsError: {
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
    },
    testError: {
        color: theme.colors.useCases.alertSeverity.error.main
    }
}));
