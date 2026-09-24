import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { useCoreState, getCoreSync, getCore } from "core";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Select, MenuItem, Alert, Stack, Box } from "@mui/material";
import { ProviderCard } from "./ProviderCard";
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
        functions: { aiAccountUiController: account, aiProviderFormUiController: form }
    } = getCoreSync();

    const state = useCoreState("aiAccountUiController", "main");
    const formState = useCoreState("aiProviderFormUiController", "main");

    const { t } = useTranslation({ AccountAiTab });
    const { t: tForm } = useTranslation("CustomProviderFormDialog");
    const { classes } = useStyles();

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

                    return (
                        <ProviderCard
                            key={`${provider.origin}/${provider.name}`}
                            name={provider.name}
                            subtitle={
                                provider.origin === "configured by admin"
                                    ? t("provided by organization")
                                    : t("custom providers section title")
                            }
                            state={provider.connectionState}
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
                            onManage={() => form.open({ providerName: provider.name })}
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
            {/* `CustomProviderFormDialog` is only for the providers being created */}
            {formState.isOpen &&
                formState.isEditing &&
                (() => {
                    const provider = state.providers.find(
                        provider => provider.name === formState.providerName_current
                    );

                    if (provider === undefined) {
                        return null;
                    }

                    const { connectionTest, formValues } = formState;

                    const isCreatedByUser = provider.origin === "created by user";

                    return (
                        <ManageProvidersDialog
                            providerNames={state.providers.map(({ name }) => name)}
                            provider={{
                                name: provider.name,
                                subtitle:
                                    provider.origin === "configured by admin"
                                        ? t("provided by organization")
                                        : t("custom providers section title"),
                                state: formState.connectionState,
                                configuration: isCreatedByUser
                                    ? {
                                          name: formValues.name,
                                          providerType: formValues.providerType,
                                          supportedProviderTypes:
                                              formState.supportedProviderTypes,
                                          nameError:
                                              !formState.isNameValid &&
                                              formValues.name !== ""
                                                  ? tForm("invalid name")
                                                  : undefined
                                      }
                                    : undefined,
                                apiBase: isCreatedByUser
                                    ? formValues.apiBase
                                    : provider.apiBase,
                                isApiBaseEditable: isCreatedByUser,
                                apiBaseError:
                                    !formState.isApiBaseValid && formValues.apiBase !== ""
                                        ? tForm("invalid api base")
                                        : undefined,
                                apiKey: formState.canEditApiKey
                                    ? formState.formValues.apiKey
                                    : provider.auth.stateDescription === "authenticated"
                                      ? provider.auth.apiKey
                                      : undefined,
                                isApiKeyEditable: formState.canEditApiKey,
                                availableModels:
                                    connectionTest.stateDescription === "succeeded"
                                        ? connectionTest.availableModels.map(
                                              ({ id }) => id
                                          )
                                        : undefined,
                                selectedModelIds: formState.selectedModelIds_draft,
                                isModelSelectionDisabled:
                                    formState.isSubmitting ||
                                    provider.operationState === "pending" ||
                                    (provider.origin === "created by user" &&
                                        provider.isNameConflicting),
                                connectionError: formState.isApiKeyMissing
                                    ? t("api-key not provided")
                                    : connectionTest.stateDescription === "failed"
                                      ? t("gateway error")
                                      : formState.hasSubmissionFailed
                                        ? t("save failed")
                                        : undefined,
                                canTestConnection: formState.canTestConnection,
                                canRefreshCredentials: provider.canRefreshToken,
                                isRefreshingCredentials:
                                    provider.operationState === "pending" ||
                                    provider.auth.stateDescription === "fetching",
                                canSave: formState.canSubmit,
                                canDelete:
                                    isCreatedByUser &&
                                    provider.operationState !== "pending",
                                documentation:
                                    provider.origin === "configured by admin"
                                        ? provider.documentation
                                        : undefined
                            }}
                            onProviderChange={providerName => form.open({ providerName })}
                            onClose={() => form.close()}
                            onNameChange={name =>
                                form.changeValue({ key: "name", value: name })
                            }
                            onProviderTypeChange={providerType =>
                                form.changeProviderType({ providerType })
                            }
                            onApiBaseChange={apiBase =>
                                form.changeValue({ key: "apiBase", value: apiBase })
                            }
                            onApiKeyChange={apiKey =>
                                form.changeValue({ key: "apiKey", value: apiKey })
                            }
                            onSelectedModelsChange={selectedModelIds =>
                                form.changeSelectedModelIds({ selectedModelIds })
                            }
                            onRefreshCredentials={() =>
                                account.refreshToken({ providerName: provider.name })
                            }
                            onTestConnection={() => form.testConnection()}
                            onSave={() => form.submit()}
                            onDelete={async () => {
                                const isConfirmed = await confirmProviderDeletion();

                                if (!isConfirmed) {
                                    return;
                                }

                                form.close();
                                await account.deleteUserProvider({
                                    providerName: provider.name
                                });
                            }}
                        />
                    );
                })()}
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
