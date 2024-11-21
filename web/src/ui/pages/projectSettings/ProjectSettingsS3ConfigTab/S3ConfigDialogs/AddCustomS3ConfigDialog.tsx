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
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { Text } from "onyxia-ui/Text";
import { TestS3ConnectionButton } from "../TestS3ConnectionButton";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";

export type Props = {
    evtOpen: NonPostableEvt<{
        s3ConfigIdToEdit: string | undefined;
    }>;
};

export const AddCustomS3ConfigDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    const { s3ConfigCreation } = useCore().functions;

    const { isReady } = useCoreState("s3ConfigCreation", "main");

    useEvt(
        ctx =>
            evtOpen.attach(ctx, ({ s3ConfigIdToEdit }) =>
                s3ConfigCreation.initialize({ s3ConfigIdToEdit })
            ),
        [evtOpen]
    );

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
                buttons: classes.buttons
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
    buttons: {
        display: "flex"
    }
});

type ButtonsProps = {
    onCloseCancel: () => void;
    onCloseSubmit: () => void;
};

const Buttons = memo((props: ButtonsProps) => {
    const { onCloseCancel, onCloseSubmit } = props;

    const {
        isReady,
        connectionTestStatus,
        isFormSubmittable,
        isEditionOfAnExistingConfig
    } = useCoreState("s3ConfigCreation", "main");

    const { s3ConfigCreation } = useCore().functions;

    const { css } = useButtonsStyles();

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    if (!isReady) {
        return null;
    }

    return (
        <>
            <TestS3ConnectionButton
                connectionTestStatus={connectionTestStatus}
                onTestConnection={
                    !isFormSubmittable ? undefined : s3ConfigCreation.testConnection
                }
            />
            <div className={css({ flex: 1 })} />
            <Button onClick={onCloseCancel} variant="secondary">
                {t("cancel")}
            </Button>
            <Button onClick={onCloseSubmit} disabled={!isFormSubmittable}>
                {isEditionOfAnExistingConfig ? t("update config") : t("save config")}
            </Button>
        </>
    );
});

const useButtonsStyles = tss
    .withName(`${symToStr({ AddCustomS3ConfigDialog })}${symToStr({ Buttons })}`)
    .create({});

const Body = memo(() => {
    const { isReady, formValues, formValuesErrors, urlStylesExamples } = useCoreState(
        "s3ConfigCreation",
        "main"
    );

    const { s3ConfigCreation } = useCore().functions;

    const { classes, css, theme } = useBodyStyles();

    const { t } = useTranslation({ AddCustomS3ConfigDialog });

    if (!isReady) {
        return null;
    }

    return (
        <>
            <FormGroup className={classes.serverConfigFormGroup}>
                <TextField
                    className={css({
                        marginBottom: theme.spacing(6)
                    })}
                    label={t("friendlyName textField label")}
                    helperText={t("friendlyName textField helper text")}
                    helperTextError={
                        formValuesErrors.friendlyName === undefined
                            ? undefined
                            : t(formValuesErrors.friendlyName)
                    }
                    defaultValue={formValues.friendlyName}
                    doOnlyShowErrorAfterFirstFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            key: "friendlyName",
                            value
                        })
                    }
                />
                <TextField
                    label={t("url textField label")}
                    helperText={t("url textField helper text")}
                    helperTextError={
                        formValuesErrors.url === undefined
                            ? undefined
                            : t(formValuesErrors.url)
                    }
                    defaultValue={formValues.url}
                    doOnlyShowErrorAfterFirstFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            key: "url",
                            value
                        })
                    }
                />
                <TextField
                    label={t("region textField label")}
                    helperText={t("region textField helper text")}
                    helperTextError={
                        formValuesErrors.region === undefined
                            ? undefined
                            : t(formValuesErrors.region)
                    }
                    defaultValue={formValues.region}
                    doOnlyShowErrorAfterFirstFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            key: "region",
                            value
                        })
                    }
                />
                <TextField
                    label={t("workingDirectoryPath textField label")}
                    className={css({
                        marginBottom: theme.spacing(4)
                    })}
                    helperText={t("workingDirectoryPath textField helper text")}
                    helperTextError={
                        formValuesErrors.workingDirectoryPath === undefined
                            ? undefined
                            : t(formValuesErrors.workingDirectoryPath)
                    }
                    defaultValue={formValues.workingDirectoryPath}
                    doOnlyShowErrorAfterFirstFocusLost
                    onValueBeingTypedChange={({ value }) =>
                        s3ConfigCreation.changeValue({
                            key: "workingDirectoryPath",
                            value
                        })
                    }
                />
                <FormControl
                    className={css({
                        "& code": {
                            fontSize: "0.9rem",
                            color: theme.colors.useCases.typography.textSecondary
                        }
                    })}
                >
                    <FormLabel id="path-style">{t("url style")}</FormLabel>
                    <Text
                        typo="caption"
                        color="secondary"
                        className={css({
                            marginBottom: theme.spacing(2)
                        })}
                    >
                        {t("url style helper text")}
                    </Text>
                    <RadioGroup
                        aria-labelledby="path-style"
                        value={formValues.pathStyleAccess ? "path" : "virtual-hosted"}
                        onChange={(_, value) =>
                            s3ConfigCreation.changeValue({
                                key: "pathStyleAccess",
                                value: value === "path"
                            })
                        }
                    >
                        <FormControlLabel
                            value="path"
                            control={<Radio />}
                            label={t("path style label", {
                                example: urlStylesExamples?.pathStyle
                            })}
                        />
                        <FormControlLabel
                            value="virtual-hosted"
                            control={<Radio />}
                            label={t("virtual-hosted style label", {
                                example: urlStylesExamples?.virtualHostedStyle
                            })}
                        />
                    </RadioGroup>
                </FormControl>
            </FormGroup>
            <FormGroup className={classes.accountCredentialsFormGroup}>
                <FormLabel
                    className={css({
                        marginBottom: theme.spacing(3)
                    })}
                >
                    {t("account credentials")}
                </FormLabel>
                <FormControl
                    className={css({
                        marginBottom: theme.spacing(6)
                    })}
                    component="fieldset"
                    variant="standard"
                >
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formValues.isAnonymous}
                                    onChange={(...[, isChecked]) =>
                                        s3ConfigCreation.changeValue({
                                            key: "isAnonymous",
                                            value: isChecked
                                        })
                                    }
                                />
                            }
                            label={t("isAnonymous switch label")}
                        />
                    </FormGroup>
                    <FormHelperText>{t("isAnonymous switch helper text")}</FormHelperText>
                </FormControl>
                {!formValues.isAnonymous && (
                    <>
                        <TextField
                            className={css({
                                marginBottom: theme.spacing(6)
                            })}
                            label={t("accessKeyId textField label")}
                            helperText={t("accessKeyId textField helper text")}
                            helperTextError={
                                formValuesErrors.accessKeyId === undefined
                                    ? undefined
                                    : t(formValuesErrors.accessKeyId)
                            }
                            defaultValue={formValues.accessKeyId ?? ""}
                            doOnlyShowErrorAfterFirstFocusLost
                            onValueBeingTypedChange={({ value }) =>
                                s3ConfigCreation.changeValue({
                                    key: "accessKeyId",
                                    value: value || undefined
                                })
                            }
                        />
                        <TextField
                            className={css({
                                marginBottom: theme.spacing(6)
                            })}
                            type="sensitive"
                            selectAllTextOnFocus
                            label={t("secretAccessKey textField label")}
                            helperTextError={
                                formValuesErrors.secretAccessKey === undefined
                                    ? undefined
                                    : t(formValuesErrors.secretAccessKey)
                            }
                            defaultValue={formValues.secretAccessKey ?? ""}
                            doOnlyShowErrorAfterFirstFocusLost
                            onValueBeingTypedChange={({ value }) =>
                                s3ConfigCreation.changeValue({
                                    key: "secretAccessKey",
                                    value: value || undefined
                                })
                            }
                        />
                        <TextField
                            className={css({
                                marginBottom: theme.spacing(6)
                            })}
                            type="sensitive"
                            selectAllTextOnFocus
                            label={t("sessionToken textField label")}
                            helperText={t("sessionToken textField helper text")}
                            helperTextError={
                                formValuesErrors.sessionToken === undefined
                                    ? undefined
                                    : t(formValuesErrors.sessionToken)
                            }
                            defaultValue={formValues.sessionToken ?? ""}
                            doOnlyShowErrorAfterFirstFocusLost
                            onValueBeingTypedChange={({ value }) =>
                                s3ConfigCreation.changeValue({
                                    key: "sessionToken",
                                    value: value || undefined
                                })
                            }
                        />
                    </>
                )}
            </FormGroup>
        </>
    );
});

const useBodyStyles = tss
    .withName(`${symToStr({ AddCustomS3ConfigDialog })}${symToStr({ Body })}`)
    .create(({ theme }) => ({
        serverConfigFormGroup: {
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            gap: theme.spacing(6),
            marginBottom: theme.spacing(4)
        },
        accountCredentialsFormGroup: {
            borderRadius: 5,
            padding: theme.spacing(3),

            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: theme.shadows[3],
            "&:hover": {
                boxShadow: theme.shadows[6]
            }
        }
    }));

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "dialog subtitle"
    | "cancel"
    | "save config"
    | "update config"
    | "is required"
    | "must be an url"
    | "not a valid access key id"
    | "url textField label"
    | "url textField helper text"
    | "region textField label"
    | "region textField helper text"
    | "workingDirectoryPath textField label"
    | {
          K: "workingDirectoryPath textField helper text";
          R: JSX.Element;
      }
    | "account credentials"
    | "friendlyName textField label"
    | "friendlyName textField helper text"
    | "isAnonymous switch label"
    | "isAnonymous switch helper text"
    | "accessKeyId textField label"
    | "accessKeyId textField helper text"
    | "secretAccessKey textField label"
    | "sessionToken textField label"
    | "sessionToken textField helper text"
    | "url style"
    | "url style helper text"
    | {
          K: "path style label";
          P: { example: string | undefined };
          R: JSX.Element;
      }
    | {
          K: "virtual-hosted style label";
          P: { example: string | undefined };
          R: JSX.Element;
      }
>()({ AddCustomS3ConfigDialog });
export type I18n = typeof i18n;
