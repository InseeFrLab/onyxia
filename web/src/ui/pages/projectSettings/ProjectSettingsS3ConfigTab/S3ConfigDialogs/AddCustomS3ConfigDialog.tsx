import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { type NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { TextField } from "onyxia-ui/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormGroup from "@mui/material/FormGroup";
import { tss } from "tss";
import { useCore, useCoreState } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { assert, type Equals } from "tsafe/assert";
import Tooltip from "@mui/material/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    evtOpen: NonPostableEvt<void>;
};

export const AddCustomS3ConfigDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    const { s3ConfigCreation } = useCore().functions;

    const { isReady } = useCoreState("s3ConfigCreation", "main");

    useEvt(ctx => evtOpen.attach(ctx, () => s3ConfigCreation.initialize()), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([isSubmit]: [boolean]) => {
        if (isSubmit) {
            s3ConfigCreation.submit();
        } else {
            s3ConfigCreation.reset();
        }
    });

    const { classes } = useStyles();

    return (
        <Dialog
            title={t("dialog title")}
            subtitle={t("dialog subtitle")}
            maxWidth="md"
            classes={{
                "buttons": classes.buttons
            }}
            fullWidth={true}
            isOpen={isReady}
            body={<Body />}
            buttons={
                <Buttons
                    onCloseCancel={onCloseFactory(false)}
                    onCloseSubmit={onCloseFactory(true)}
                />
            }
            onClose={onCloseFactory(false)}
        />
    );
});

AddCustomS3ConfigDialog.displayName = symToStr({
    AddCustomS3ConfigDialog
});

const useStyles = tss.withName({ AddCustomS3ConfigDialog }).create({
    "buttons": {
        "display": "flex"
    }
});

type ButtonsProps = {
    onCloseCancel: () => void;
    onCloseSubmit: () => void;
};

const Buttons = memo((props: ButtonsProps) => {
    const { onCloseCancel, onCloseSubmit } = props;

    const { isReady, connectionTestStatus, isFormSubmittable } = useCoreState(
        "s3ConfigCreation",
        "main"
    );

    const { s3ConfigCreation } = useCore().functions;

    const { css } = useButtonsStyles();

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    if (!isReady) {
        return null;
    }

    return (
        <>
            <div>
                <Button
                    variant="secondary"
                    onClick={() => s3ConfigCreation.testConnection()}
                    disabled={!isFormSubmittable}
                >
                    {t("test connection")}
                </Button>
                {(() => {
                    if (connectionTestStatus.itTestOngoing) {
                        return <CircularProgress />;
                    }

                    switch (connectionTestStatus.stateDescription) {
                        case "not tested yet":
                            return null;
                        case "valid":
                            return (
                                <Icon icon={id<MuiIconComponentName>("DoneOutline")} />
                            );
                        case "invalid":
                            return (
                                <>
                                    <Icon
                                        icon={id<MuiIconComponentName>("ErrorOutline")}
                                    />
                                    <Tooltip
                                        title={t("test connection failed", {
                                            "errorMessage":
                                                connectionTestStatus.errorMessage
                                        })}
                                    >
                                        <Icon
                                            icon={id<MuiIconComponentName>("Help")}
                                            size="small"
                                        />
                                    </Tooltip>
                                </>
                            );
                    }
                    assert<Equals<typeof connectionTestStatus, never>>(false);
                })()}
            </div>
            <div className={css({ "flex": 1 })} />
            <Button onClick={onCloseCancel} variant="secondary">
                {t("cancel")}
            </Button>
            <Button onClick={onCloseSubmit} disabled={!isFormSubmittable}>
                {t("save config")}
            </Button>
        </>
    );
});

const useButtonsStyles = tss
    .withName(`${symToStr({ AddCustomS3ConfigDialog })}${symToStr({ Buttons })}`)
    .create({});

const Body = memo(() => {
    const { isReady, formValues, formValuesErrors } = useCoreState(
        "s3ConfigCreation",
        "main"
    );

    const { s3ConfigCreation } = useCore().functions;

    const { classes } = useBodyStyles();

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    if (!isReady) {
        return null;
    }

    return (
        <div className={classes.root}>
            <TextField
                className={classes.textField}
                label={t("url textField label")}
                helperText={t("url textField helper text")}
                helperTextError={
                    formValuesErrors.url === undefined
                        ? undefined
                        : t(formValuesErrors.url)
                }
                inputProps_aria-invalid={formValuesErrors.url !== undefined}
                defaultValue={formValues.url}
                doOnlyValidateInputAfterFistFocusLost
                onValueBeingTypedChange={({ value }) =>
                    s3ConfigCreation.changeValue({
                        "key": "url",
                        value
                    })
                }
            />
            <TextField
                className={classes.textField}
                label={t("region textField label")}
                helperText={t("region textField helper text")}
                helperTextError={
                    formValuesErrors.region === undefined
                        ? undefined
                        : t(formValuesErrors.region)
                }
                inputProps_aria-invalid={formValuesErrors.region !== undefined}
                defaultValue={formValues.region}
                doOnlyValidateInputAfterFistFocusLost
                onValueBeingTypedChange={({ value }) =>
                    s3ConfigCreation.changeValue({
                        "key": "region",
                        value
                    })
                }
            />
            <TextField
                className={classes.textField}
                label={t("workingDirectoryPath textField label")}
                helperText={t("workingDirectoryPath textField helper text")}
                helperTextError={
                    formValuesErrors.workingDirectoryPath === undefined
                        ? undefined
                        : t(formValuesErrors.workingDirectoryPath)
                }
                inputProps_aria-invalid={
                    formValuesErrors.workingDirectoryPath !== undefined
                }
                defaultValue={formValues.workingDirectoryPath}
                doOnlyValidateInputAfterFistFocusLost
                onValueBeingTypedChange={({ value }) =>
                    s3ConfigCreation.changeValue({
                        "key": "workingDirectoryPath",
                        value
                    })
                }
            />
            <FormGroup className={classes.accountCredentialsFormGroup}>
                <FormLabel className={classes.accountCredentialsFormGroupLabel}>
                    {t("account credentials")}
                </FormLabel>
                <TextField
                    className={classes.textField}
                    label={t("accountFriendlyName textField label")}
                    helperText={t("accountFriendlyName textField helper text")}
                    helperTextError={
                        formValuesErrors.accountFriendlyName === undefined
                            ? undefined
                            : t(formValuesErrors.accountFriendlyName)
                    }
                    inputProps_aria-invalid={
                        formValuesErrors.accountFriendlyName !== undefined
                    }
                    defaultValue={formValues.accountFriendlyName}
                    doOnlyValidateInputAfterFistFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            "key": "accountFriendlyName",
                            value
                        })
                    }
                />
                <TextField
                    className={classes.textField}
                    label={t("accessKeyId textField label")}
                    helperText={t("accessKeyId textField helper text")}
                    helperTextError={
                        formValuesErrors.accessKeyId === undefined
                            ? undefined
                            : t(formValuesErrors.accessKeyId)
                    }
                    inputProps_aria-invalid={formValuesErrors.accessKeyId !== undefined}
                    defaultValue={formValues.accessKeyId}
                    doOnlyValidateInputAfterFistFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            "key": "accessKeyId",
                            value
                        })
                    }
                />
                <TextField
                    className={classes.textField}
                    label={t("secretAccessKey textField label")}
                    helperTextError={
                        formValuesErrors.secretAccessKey === undefined
                            ? undefined
                            : t(formValuesErrors.secretAccessKey)
                    }
                    inputProps_aria-invalid={
                        formValuesErrors.secretAccessKey !== undefined
                    }
                    defaultValue={formValues.secretAccessKey}
                    doOnlyValidateInputAfterFistFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            "key": "secretAccessKey",
                            value
                        })
                    }
                />
                <TextField
                    className={classes.textField}
                    label={t("sessionToken textField label")}
                    helperText={t("sessionToken textField helper text")}
                    helperTextError={
                        formValuesErrors.sessionToken === undefined
                            ? undefined
                            : t(formValuesErrors.sessionToken)
                    }
                    inputProps_aria-invalid={formValuesErrors.sessionToken !== undefined}
                    defaultValue={formValues.sessionToken ?? ""}
                    doOnlyValidateInputAfterFistFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            "key": "sessionToken",
                            "value": value || undefined
                        })
                    }
                />
            </FormGroup>
            <FormControl>
                <FormLabel id="path-style">{t("url style")}</FormLabel>
                <RadioGroup
                    aria-labelledby="path-style"
                    value={formValues.pathStyleAccess ? "path" : "subdomain"}
                    onChange={(_, value) =>
                        s3ConfigCreation.changeValue({
                            "key": "pathStyleAccess",
                            "value": value === "path"
                        })
                    }
                >
                    {(() => {
                        const domain = formValues.url
                            .replace(/^https?:\/\//, "")
                            .replace(/\/$/, "");

                        return (
                            <>
                                <FormControlLabel
                                    value="path"
                                    control={<Radio />}
                                    label={t("path style label", { domain })}
                                />
                                <FormControlLabel
                                    value="subdomain"
                                    control={<Radio />}
                                    label={t("subdomain style label", { domain })}
                                />
                            </>
                        );
                    })()}
                </RadioGroup>
            </FormControl>
            <FormControl>
                <FormLabel id="use-for-injection">{t("use in services")}</FormLabel>
                <RadioGroup
                    aria-labelledby="use-for-injection"
                    value={formValues.isUsedForXOnyxia ? "yes" : "no"}
                    onChange={(_, value) =>
                        s3ConfigCreation.changeValue({
                            "key": "isUsedForXOnyxia",
                            "value": value === "yes"
                        })
                    }
                >
                    <FormControlLabel
                        value="yes"
                        control={<Radio />}
                        label={t("yes use in services")}
                    />
                    <FormControlLabel value="no" control={<Radio />} label={t("no")} />
                </RadioGroup>
            </FormControl>
            <FormControl>
                <FormLabel id="use-for-explorer">{t("use for explorer")}</FormLabel>
                <RadioGroup
                    aria-labelledby="use-for-explorer"
                    value={formValues.isUsedForExplorer ? "yes" : "no"}
                    onChange={(_, value) => {
                        s3ConfigCreation.changeValue({
                            "key": "isUsedForExplorer",
                            "value": value === "yes"
                        });
                    }}
                >
                    <FormControlLabel
                        value="yes"
                        control={<Radio />}
                        label={t("yes use for explorer")}
                    />
                    <FormControlLabel value="no" control={<Radio />} label={t("no")} />
                </RadioGroup>
            </FormControl>
        </div>
    );
});

const useBodyStyles = tss
    .withName(`${symToStr({ AddCustomS3ConfigDialog })}${symToStr({ Body })}`)
    .create(({ theme }) => ({
        "root": {
            "display": "flex",
            "flexDirection": "column",
            "overflow": "visible"
        },
        "textField": {
            "marginBottom": theme.spacing(6)
        },
        "accountCredentialsFormGroup": {
            "border": `1px solid ${theme.colors.useCases.typography.textDisabled}`,
            "borderRadius": 5,
            "padding": theme.spacing(2)
        },
        "accountCredentialsFormGroupLabel": {
            "marginBottom": theme.spacing(2)
        }
    }));

export const { i18n } = declareComponentKeys<
    | "dialog title"
    | "dialog subtitle"
    | "test connection"
    | {
          K: "test connection failed";
          P: { errorMessage: string };
          R: JSX.Element;
      }
    | "cancel"
    | "save config"
    | "is required"
    | "must be an url"
    | "not a valid access key id"
    | "url textField label"
    | "url textField helper text"
    | "region textField label"
    | "region textField helper text"
    | "workingDirectoryPath textField label"
    | "workingDirectoryPath textField helper text"
    | "account credentials"
    | "accountFriendlyName textField label"
    | "accountFriendlyName textField helper text"
    | "accessKeyId textField label"
    | "accessKeyId textField helper text"
    | "secretAccessKey textField label"
    | "sessionToken textField label"
    | "sessionToken textField helper text"
    | "url style"
    | {
          K: "path style label";
          P: { domain: string };
          R: JSX.Element;
      }
    | {
          K: "subdomain style label";
          P: { domain: string };
          R: JSX.Element;
      }
    | "use in services"
    | "yes use in services"
    | "no"
    | "use for explorer"
    | "yes use for explorer"
>()({ AddCustomS3ConfigDialog });
