import { memo, useEffect, useState } from "react";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { useCoreState, getCoreSync } from "core";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Select, MenuItem, Alert, Stack } from "@mui/material";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { ProviderValueField } from "./ProviderValueField";
import { ModelsSection } from "./ModelsSection";
import { CustomProviderFormDialog } from "./CustomProviderFormDialog";
import {
    ConfirmCustomProviderDeletionDialog,
    type Props as ConfirmProps
} from "./ConfirmCustomProviderDeletionDialog";
import { Evt, type UnpackEvt } from "evt";
import { useConst } from "powerhooks/useConst";
import { Deferred } from "evt/tools/Deferred";

export type Props = { className?: string };
export const AccountAiTab = memo((props: Props) => {
    const {
        functions: {
            aiAccountUiController: account,
            aiProviderCreationFormUiController: form
        }
    } = getCoreSync();

    const state = useCoreState("aiAccountUiController", "main");

    const { t } = useTranslation({ AccountAiTab });

    const evtOpen = useConst(() => Evt.create<UnpackEvt<ConfirmProps["evtOpen"]>>());

    function confirmProviderDeletion(): Promise<boolean> {
        const confirmation = new Deferred<boolean>();
        evtOpen.post({ resolveDoProceed: confirmation.resolve });
        return confirmation.pr;
    }

    //See with Jo if it's possible to add loader
    useEffect(() => {
        account.load();
    }, [account]);

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
            {state.providers.map(provider => (
                <Stack
                    key={`${provider.origin}/${provider.name}`}
                    spacing={2}
                    component="section"
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Text typo="section heading">{provider.name}</Text>
                        {provider.canRefreshToken && (
                            <Button
                                variant="ternary"
                                disabled={
                                    provider.operationState === "pending" ||
                                    provider.auth.stateDescription === "fetching"
                                }
                                onClick={() =>
                                    account.refreshToken({
                                        providerName: provider.name
                                    })
                                }
                            >
                                {t("refresh credentials")}
                            </Button>
                        )}
                        {provider.origin === "created by user" && (
                            <>
                                <Button
                                    variant="ternary"
                                    disabled={provider.operationState === "pending"}
                                    onClick={() =>
                                        form.open({ providerName: provider.name })
                                    }
                                >
                                    {t("edit provider")}
                                </Button>
                                <Button
                                    variant="ternary"
                                    disabled={provider.operationState === "pending"}
                                    onClick={async () => {
                                        const isConfirmed =
                                            await confirmProviderDeletion();

                                        if (!isConfirmed) {
                                            return;
                                        }

                                        await account.deleteUserProvider({
                                            providerName: provider.name
                                        });
                                    }}
                                >
                                    {t("delete provider")}
                                </Button>
                            </>
                        )}
                    </Stack>
                    {provider.origin === "configured by admin" &&
                        provider.description !== undefined && (
                            <LocalizedMarkdown>{provider.description}</LocalizedMarkdown>
                        )}
                    {provider.origin === "created by user" &&
                        provider.isNameConflicting && (
                            <Alert severity="error">{t("invalid name")}</Alert>
                        )}
                    {provider.operationState === "error" && (
                        <Alert severity="error">{t("save failed")}</Alert>
                    )}
                    <ProviderValueField
                        label={t("api base url")}
                        value={provider.apiBase}
                        onRequestCopy={() => copyToClipboard(provider.apiBase)}
                    />
                    {(provider.auth.stateDescription === "fetching" ||
                        provider.models.stateDescription === "fetching") && (
                        <CircularProgress size={20} />
                    )}
                    {(provider.auth.stateDescription === "error" ||
                        provider.auth.stateDescription === "authentication required") && (
                        <Alert severity="warning">{t("authentication required")}</Alert>
                    )}
                    {provider.models.stateDescription === "error" && (
                        <Alert severity="warning">{t("gateway error")}</Alert>
                    )}
                    {provider.canUserLogIn &&
                        (provider.auth.stateDescription === "authentication required" ||
                            provider.auth.stateDescription === "error") && (
                            <Button
                                variant="secondary"
                                disabled={provider.operationState === "pending"}
                                onClick={() =>
                                    account.logInToProvider({
                                        providerName: provider.name
                                    })
                                }
                            >
                                {t("connect provider")}
                            </Button>
                        )}
                    {provider.canUserProvideApiKey && (
                        <ApiKeyForm
                            key={`${provider.name}/${provider.userProvidedApiKey}`}
                            initialValue={provider.userProvidedApiKey}
                            disabled={
                                provider.operationState === "pending" ||
                                provider.auth.stateDescription === "fetching"
                            }
                            onSave={apiKey =>
                                account.setApiKey({ providerName: provider.name, apiKey })
                            }
                        />
                    )}
                    {provider.auth.stateDescription === "authenticated" &&
                        !provider.canUserProvideApiKey && (
                            <ProviderValueField
                                label={t("api key")}
                                value={provider.auth.apiKey}
                                isSensitiveInformation
                                onRequestCopy={() => {
                                    if (
                                        provider.auth.stateDescription === "authenticated"
                                    )
                                        copyToClipboard(provider.auth.apiKey);
                                }}
                            />
                        )}
                    {provider.models.stateDescription === "loaded" && (
                        <ModelsSection
                            models={provider.models.availableModels}
                            selectedModels={provider.selectedModelIds}
                            disabled={
                                provider.operationState === "pending" ||
                                (provider.origin === "created by user" &&
                                    provider.isNameConflicting)
                            }
                            onSelectedModelsChange={modelIds =>
                                account.setSelectedModelIds({
                                    providerName: provider.name,
                                    modelIds
                                })
                            }
                        />
                    )}
                </Stack>
            ))}
            {account.canUserCreateProviders() && (
                <Button
                    variant="secondary"
                    onClick={() => form.open({ providerName: undefined })}
                >
                    {t("add custom ai provider")}
                </Button>
            )}
            <CustomProviderFormDialog />
            <ConfirmCustomProviderDeletionDialog evtOpen={evtOpen} />
        </Stack>
    );
});
function ApiKeyForm(props: {
    initialValue: string;
    disabled: boolean;
    onSave: (apiKey: string) => Promise<void>;
}) {
    const [value, setValue] = useState(props.initialValue);
    const { t } = useTranslation({ AccountAiTab });
    return (
        <ProviderValueField
            label={t("api key")}
            value={value}
            isSensitiveInformation={true}
            disabled={props.disabled}
            onChange={setValue}
            onSave={() => props.onSave(value)}
            saveLabel={t("save key")}
            onRequestCopy={() => copyToClipboard(value)}
        />
    );
}

const { i18n } = declareComponentKeys<
    | "invalid name"
    | "connect provider"
    | "default model"
    | "no default model"
    | "save key"
    | "save failed"
    | "retry"
    | "authentication required"
    | "selected models"
    | "default provider"
    | "set default provider"
    | "refresh credentials"
    | "delete provider"
    | "edit provider"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "api key"
    | "gateway error"
    | "custom providers section title"
    | "custom providers section helper"
    | "add custom ai provider"
    | "custom provider api base field"
    | "custom provider api key field"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiTab });
export type I18n = typeof i18n;
