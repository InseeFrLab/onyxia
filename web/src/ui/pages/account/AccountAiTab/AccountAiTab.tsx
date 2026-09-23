import { useState } from "react";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { useCoreState, getCoreSync, getCore } from "core";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Select, MenuItem, Alert, Stack, Box } from "@mui/material";
import { ProviderCard, type ProviderState } from "./ProviderCard";
import { AddCustomProviderButton } from "./AddCustomProviderButton";
import { providerTypeLogoUrl } from "./shared/providerTypeLogoUrl";
import { ManageProvidersDialog } from "./dialogs/ManageProvidersDialog";
import { CustomProviderFormDialog } from "./dialogs/CustomProviderFormDialog";
import {
    ConfirmCustomProviderDeletionDialog,
    type Props as ConfirmProps
} from "./dialogs/ConfirmCustomProviderDeletionDialog";
import { Evt, type UnpackEvt } from "evt";
import { useConst } from "powerhooks/useConst";
import { Deferred } from "evt/tools/Deferred";
import { withLoader } from "ui/tools/withLoader";
import { tss } from "tss";

export type Props = { className?: string };

export const AccountAiTab = withLoader({
    loader: async () => {
        const {
            functions: { aiAccountUiController: account }
        } = await getCore();

        await account.load();
    },
    FallbackComponent: () => null,
    Component
});

function Component(props: Props) {
    const {
        functions: {
            aiAccountUiController: account,
            aiProviderCreationFormUiController: form
        }
    } = getCoreSync();

    const state = useCoreState("aiAccountUiController", "main");

    const { t } = useTranslation({ AccountAiTab });
    const { classes } = useStyles();
    const [managedProviderName, setManagedProviderName] = useState<string>();

    const evtOpen = useConst(() => Evt.create<UnpackEvt<ConfirmProps["evtOpen"]>>());

    function confirmProviderDeletion(): Promise<boolean> {
        const confirmation = new Deferred<boolean>();
        evtOpen.post({ resolveDoProceed: confirmation.resolve });
        return confirmation.pr;
    }

    if (!state.isReady) {
        if (state.stateDescription === "error")
            return (
                <Stack spacing={2}>
                    <Alert severity="error">{t("gateway error")}</Alert>
                    <Button onClick={() => account.load()}>{t("retry")}</Button>
                </Stack>
            );
        return <CircularProgress />;
    }
    return (
        <Stack className={props.className} spacing={4}>
            {state.configSaveState === "error" && (
                <Alert
                    severity="error"
                    action={
                        <Button onClick={() => account.retrySave()}>{t("retry")}</Button>
                    }
                >
                    {t("save failed")}
                </Alert>
            )}
            <Stack spacing={1}>
                <Text typo="label 1">{t("default model")}</Text>
                <Select
                    value={state.defaultModel ?? ""}
                    displayEmpty
                    inputProps={{ "aria-label": t("default model") }}
                    onChange={event =>
                        account.setDefaultModel({
                            model:
                                event.target.value === "" ? undefined : event.target.value
                        })
                    }
                >
                    <MenuItem value="">{t("no default model")}</MenuItem>
                    {state.defaultModelOptions.map(({ value: model }) => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>
            <Box className={classes.providerGrid}>
                {state.providers.map(provider => {
                    const isDisabled =
                        provider.operationState === "pending" ||
                        (provider.origin === "created by user" &&
                            provider.isNameConflicting);
                    const providerState: ProviderState =
                        provider.auth.stateDescription === "error" ||
                        provider.models.stateDescription === "error"
                            ? "connection error"
                            : provider.auth.stateDescription !== "authenticated" ||
                                (provider.models.stateDescription === "loaded" &&
                                    provider.selectedModelIds.length === 0)
                              ? "setup required"
                              : "connected";

                    return (
                        <ProviderCard
                            key={`${provider.origin}/${provider.name}`}
                            name={provider.name}
                            subtitle={
                                provider.origin === "configured by admin"
                                    ? t("provided by organization")
                                    : t("custom providers section title")
                            }
                            state={providerState}
                            logoUrl={
                                provider.origin === "created by user"
                                    ? providerTypeLogoUrl[provider.providerType]
                                    : provider.logoUrl
                            }
                            modelSelector={{
                                isDisabled:
                                    isDisabled ||
                                    provider.models.stateDescription !== "loaded",
                                models:
                                    provider.models.stateDescription === "loaded"
                                        ? provider.models.availableModels.map(
                                              ({ id }) => id
                                          )
                                        : [],
                                selectedModels: provider.selectedModelIds,
                                onSelectedModelsChange: modelIds =>
                                    account.setSelectedModelIds({
                                        providerName: provider.name,
                                        modelIds
                                    })
                            }}
                            manageLabel={t("manage")}
                            onManage={() => setManagedProviderName(provider.name)}
                        />
                    );
                })}
                {account.canUserCreateProviders() && (
                    <AddCustomProviderButton
                        className={classes.addCustomProviderButton}
                        label={t("add custom ai provider")}
                        onClick={() => form.open({ providerName: undefined })}
                    />
                )}
            </Box>
            {managedProviderName !== undefined && (
                <ManageProvidersDialog
                    initialProviderName={managedProviderName}
                    providers={state.providers.map(provider => ({
                        name: provider.name,
                        subtitle:
                            provider.origin === "configured by admin"
                                ? t("provided by organization")
                                : t("custom providers section title"),
                        apiBase: provider.apiBase,
                        apiKey:
                            provider.auth.stateDescription === "authenticated"
                                ? provider.auth.apiKey
                                : provider.canUserProvideApiKey
                                  ? provider.userProvidedApiKey
                                  : undefined,
                        isApiKeyEditable: provider.canUserProvideApiKey,
                        availableModels:
                            provider.models.stateDescription === "loaded"
                                ? provider.models.availableModels.map(({ id }) => id)
                                : undefined,
                        selectedModelIds: provider.selectedModelIds,
                        isModelSelectionDisabled:
                            provider.operationState === "pending" ||
                            (provider.origin === "created by user" &&
                                provider.isNameConflicting),
                        connectionError:
                            provider.auth.stateDescription === "error" ||
                            provider.auth.stateDescription === "api-key not provided"
                                ? t("api-key not provided")
                                : provider.models.stateDescription === "error"
                                  ? t("gateway error")
                                  : provider.operationState === "error"
                                    ? t("save failed")
                                    : undefined,
                        canRefreshCredentials: provider.canRefreshToken,
                        isRefreshingCredentials:
                            provider.operationState === "pending" ||
                            provider.auth.stateDescription === "fetching",
                        canEdit:
                            provider.origin === "created by user" &&
                            provider.operationState !== "pending",
                        canDelete:
                            provider.origin === "created by user" &&
                            provider.operationState !== "pending",
                        documentation:
                            provider.origin === "configured by admin"
                                ? provider.documentation
                                : undefined
                    }))}
                    onClose={() => setManagedProviderName(undefined)}
                    onRefreshCredentials={providerName =>
                        account.refreshToken({ providerName })
                    }
                    onTestConnection={providerName =>
                        account.testConnection({ providerName })
                    }
                    onEdit={providerName => {
                        setManagedProviderName(undefined);
                        form.open({ providerName });
                    }}
                    onDelete={async providerName => {
                        const isConfirmed = await confirmProviderDeletion();

                        if (!isConfirmed) {
                            return;
                        }

                        setManagedProviderName(undefined);
                        await account.deleteUserProvider({ providerName });
                    }}
                    onSaveModels={({ providerName, modelIds }) =>
                        account.setSelectedModelIds({ providerName, modelIds })
                    }
                    onSaveApiKey={({ providerName, apiKey }) =>
                        account.setApiKey({ providerName, apiKey })
                    }
                />
            )}
            <CustomProviderFormDialog />
            <ConfirmCustomProviderDeletionDialog evtOpen={evtOpen} />
        </Stack>
    );
}

const useStyles = tss.withName({ AccountAiTab }).create(({ theme }) => {
    const gridGap = theme.spacing(1.25);

    return {
        providerGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: gridGap,
            "@media (max-width: 760px)": {
                gridTemplateColumns: "1fr"
            }
        },
        addCustomProviderButton: {
            // Always on its own row, below the providers, but as wide as one of them.
            gridColumn: "1 / -1",
            justifySelf: "start",
            width: `calc((100% - ${gridGap}px) / 2)`,
            "@media (max-width: 760px)": {
                width: "100%"
            }
        }
    };
});

const { i18n } = declareComponentKeys<
    | "default model"
    | "no default model"
    | "save failed"
    | "retry"
    | "api-key not provided"
    | "provided by organization"
    | "manage"
    | "gateway error"
    | "custom providers section title"
    | "add custom ai provider"
>()({ AccountAiTab });
export type I18n = typeof i18n;
