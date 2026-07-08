import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useEvt } from "evt/hooks";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { assert } from "tsafe/assert";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import TextField from "@mui/material/TextField";
import { getCoreSync } from "core";

export type Props = {
    evtOpen: NonPostableEvt<{
        editedProvider:
            | {
                  id: string;
                  name: string;
                  provider: string;
                  apiBase: string;
                  apiKey: string;
              }
            | undefined;
    }>;
};

type OpenParams = UnpackEvt<Props["evtOpen"]>;

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

const defaultFormValues: FormValues = {
    name: "",
    provider: "openai",
    apiBase: "",
    apiKey: ""
};

export const CustomProviderFormDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ CustomProviderFormDialog });

    const {
        functions: { ai }
    } = getCoreSync();

    // The add/edit custom-provider form is entirely UI-owned: its open state, edited
    // values and connection-test result never go through the core. The core only
    // exposes the resulting operations (add/edit/test).
    const [openState, setOpenState] = useState<
        { editedProviderId: string | undefined } | undefined
    >(undefined);
    const [values, setValues] = useState<FormValues>(defaultFormValues);
    const [test, setTest] = useState<FormTest>({ stateDescription: "idle" });

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ editedProvider }: OpenParams) => {
                setValues(
                    editedProvider === undefined
                        ? defaultFormValues
                        : {
                              name: editedProvider.name,
                              provider: editedProvider.provider,
                              apiBase: editedProvider.apiBase,
                              apiKey: editedProvider.apiKey
                          }
                );
                setTest({ stateDescription: "idle" });
                setOpenState({ editedProviderId: editedProvider?.id });
            });
        },
        [evtOpen]
    );

    const isEditing = openState?.editedProviderId !== undefined;
    const canSave =
        values.name !== "" &&
        values.provider !== "" &&
        values.apiBase !== "" &&
        values.apiKey !== "";
    const canTest =
        values.apiBase !== "" &&
        values.apiKey !== "" &&
        test.stateDescription !== "testing";

    const onClose = useConstCallback(() => setOpenState(undefined));

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
        assert(openState !== undefined);
        const { editedProviderId } = openState;
        setOpenState(undefined);
        if (editedProviderId === undefined) {
            await ai.addCustomProvider(values);
        } else {
            await ai.editCustomProvider({ providerId: editedProviderId, ...values });
        }
    });

    return (
        <Dialog
            title={t(
                isEditing ? "edit custom provider title" : "add custom provider title"
            )}
            isOpen={openState !== undefined}
            onClose={onClose}
            body={
                <div className={classes.formFields}>
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
                        <Button variant="secondary" onClick={onTest} disabled={!canTest}>
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
                            <Text typo="body 2" className={classes.testError}>
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
    );
});

const { i18n } = declareComponentKeys<
    | "add custom provider title"
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
>()({ CustomProviderFormDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ CustomProviderFormDialog }).create(({ theme }) => ({
    formFields: {
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
