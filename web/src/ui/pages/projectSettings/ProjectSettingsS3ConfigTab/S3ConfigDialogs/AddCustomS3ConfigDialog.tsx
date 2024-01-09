import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import { Evt, type NonPostableEvt, type StatefulEvt, type UnpackEvt } from "evt";
import { useEvt, useRerenderOnStateChange } from "evt/hooks";
import { TextField } from "onyxia-ui/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import FormGroup from "@mui/material/FormGroup";
import { tss } from "tss";

export type Props = {
    evtOpen: NonPostableEvt<{
        defaultValues: {
            url: string;
            region: string;
            workingDirectoryPath: string;
            pathStyleAccess: boolean;
        };
        resolveNewCustomConfig: (params: {
            newCustomConfig: NewCustomConfig | undefined;
        }) => void;
    }>;
};

type NewCustomConfig = {
    url: string;
    region: string;
    workingDirectoryPath: string;
    accountFriendlyName: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string | undefined;
    pathStyleAccess: boolean;
    isUsedForExplorer: boolean;
    isUsedForXOnyxia: boolean;
};

export const AddCustomS3ConfigDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const [state, setState] = useState<
        | {
              resolveNewCustomConfig: UnpackEvt<
                  Props["evtOpen"]
              >["resolveNewCustomConfig"];
              evtNewCustomConfig: StatefulEvt<NewCustomConfig>;
          }
        | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ resolveNewCustomConfig, defaultValues }) =>
                setState({
                    resolveNewCustomConfig,
                    "evtNewCustomConfig": Evt.create<NewCustomConfig>({
                        ...defaultValues,
                        "accountFriendlyName": "",
                        "accessKeyId": "",
                        "secretAccessKey": "",
                        "sessionToken": undefined,
                        "isUsedForExplorer": false,
                        "isUsedForXOnyxia": false
                    })
                })
            );
        },
        [evtOpen]
    );

    const onCloseFactory = useCallbackFactory(([isConfirm]: [boolean]) => {
        assert(state !== undefined);

        state.resolveNewCustomConfig({
            "newCustomConfig": isConfirm ? state.evtNewCustomConfig.state : undefined
        });

        setState(undefined);
    });

    const { windowInnerHeight } = useWindowInnerSize();

    const { classes } = useStyles({
        windowInnerHeight
    });

    return (
        <Dialog
            title="New custom S3 configuration"
            className={classes.root}
            maxWidth="md"
            fullWidth={true}
            body={
                state === undefined ? (
                    <></>
                ) : (
                    <Body
                        className={classes.body}
                        evtNewCustomConfig={state.evtNewCustomConfig}
                    />
                )
            }
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} autoFocus variant="secondary">
                        Cancel
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        Add config
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
        />
    );
});

AddCustomS3ConfigDialog.displayName = symToStr({
    AddCustomS3ConfigDialog
});

const useStyles = tss
    .withName({ AddCustomS3ConfigDialog })
    .withParams<{ windowInnerHeight: number }>()
    .create(({ theme, windowInnerHeight }) => ({
        "root": {
            "display": "flex",
            "flexDirection": "column",
            "maxHeight": windowInnerHeight - theme.spacing(4)
        },
        "body": {
            "flex": 1,
            "overflow": "auto"
        }
    }));

const Body = memo(
    (props: { className?: string; evtNewCustomConfig: StatefulEvt<NewCustomConfig> }) => {
        const { className, evtNewCustomConfig } = props;

        useRerenderOnStateChange(evtNewCustomConfig);

        const { classes, cx } = useBodyStyles();

        return (
            <div className={cx(classes.root, className)}>
                <TextField
                    className={classes.textField}
                    label="URL"
                    helperText="The URL of the S3 endpoint"
                    defaultValue={evtNewCustomConfig.state.url}
                    doOnlyValidateInputAfterFistFocusLost
                    getIsValidValue={url => {
                        try {
                            new URL(url);
                        } catch (error) {
                            return {
                                "isValidValue": false,
                                "message": "Invalid URL"
                            };
                        }

                        return {
                            "isValidValue": true
                        };
                    }}
                    onValueBeingTypedChange={({ value }) =>
                        (evtNewCustomConfig.state = {
                            ...evtNewCustomConfig.state,
                            "url": value
                        })
                    }
                />
                <TextField
                    className={classes.textField}
                    label="Region"
                    helperText="The region of the S3 endpoint"
                    defaultValue={evtNewCustomConfig.state.region}
                    onValueBeingTypedChange={({ value }) =>
                        (evtNewCustomConfig.state = {
                            ...evtNewCustomConfig.state,
                            "region": value
                        })
                    }
                />
                <TextField
                    className={classes.textField}
                    label="Working directory path"
                    helperText="<bucket>/<object prefix> example: my-bucket/my-directory/"
                    defaultValue={evtNewCustomConfig.state.workingDirectoryPath}
                    onValueBeingTypedChange={({ value }) => {
                        evtNewCustomConfig.state = {
                            ...evtNewCustomConfig.state,
                            "workingDirectoryPath": value
                        };
                    }}
                />
                <FormGroup className={classes.accountCredentialsFormGroup}>
                    <FormLabel className={classes.accountCredentialsFormGroupLabel}>
                        Account credentials
                    </FormLabel>
                    <TextField
                        className={classes.textField}
                        label="Account friendly name"
                        helperText="This is just to help you identify the account"
                        defaultValue={evtNewCustomConfig.state.accountFriendlyName}
                        onValueBeingTypedChange={({ value }) =>
                            (evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "accountFriendlyName": value
                            })
                        }
                    />
                    <TextField
                        className={classes.textField}
                        label="Access key ID"
                        defaultValue={evtNewCustomConfig.state.accessKeyId}
                        onValueBeingTypedChange={({ value }) =>
                            (evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "accessKeyId": value
                            })
                        }
                    />
                    <TextField
                        className={classes.textField}
                        label="Secret access key"
                        defaultValue={evtNewCustomConfig.state.secretAccessKey}
                        onValueBeingTypedChange={({ value }) =>
                            (evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "secretAccessKey": value
                            })
                        }
                    />
                    <TextField
                        className={classes.textField}
                        label="Session token"
                        helperText="Optional, only if you use temporary credentials"
                        defaultValue={evtNewCustomConfig.state.sessionToken ?? ""}
                        onValueBeingTypedChange={({ value }) =>
                            (evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "sessionToken": value || undefined
                            })
                        }
                    />
                </FormGroup>
                <FormControl>
                    <FormLabel id="path-style">Url style</FormLabel>
                    <RadioGroup
                        aria-labelledby="path-style"
                        value={
                            evtNewCustomConfig.state.pathStyleAccess
                                ? "path"
                                : "subdomain"
                        }
                        onChange={(_, value) => {
                            evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "pathStyleAccess": value === "path"
                            };
                        }}
                    >
                        <FormControlLabel
                            value="path"
                            control={<Radio />}
                            label={`Path style (${evtNewCustomConfig.state.url}/<bucket>/<object name>)`}
                        />
                        <FormControlLabel
                            value="subdomain"
                            control={<Radio />}
                            label={`Subdomain style (<bucket>.${evtNewCustomConfig.state.url}/<object name>)`}
                        />
                    </RadioGroup>
                </FormControl>
                <FormControl>
                    <FormLabel id="use-for-injection">Use in services</FormLabel>
                    <RadioGroup
                        aria-labelledby="use-for-injection"
                        value={evtNewCustomConfig.state.isUsedForXOnyxia ? "yes" : "no"}
                        onChange={(_, value) => {
                            evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "isUsedForXOnyxia": value === "yes"
                            };
                        }}
                    >
                        <FormControlLabel
                            value="yes"
                            control={<Radio />}
                            label={`Yes, use this configuration as default for services`}
                        />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                    </RadioGroup>
                </FormControl>
                <FormControl>
                    <FormLabel id="use-for-explorer">Use for the explorer</FormLabel>
                    <RadioGroup
                        aria-labelledby="use-for-explorer"
                        value={evtNewCustomConfig.state.isUsedForExplorer ? "yes" : "no"}
                        onChange={(_, value) => {
                            evtNewCustomConfig.state = {
                                ...evtNewCustomConfig.state,
                                "isUsedForExplorer": value === "yes"
                            };
                        }}
                    >
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                    </RadioGroup>
                </FormControl>
            </div>
        );
    }
);

const useBodyStyles = tss
    .withName(`${symToStr({ AddCustomS3ConfigDialog })}${symToStr({ Body })}`)
    .create(({ theme }) => ({
        "root": {
            "display": "flex",
            "flexDirection": "column",
            "marginTop": theme.spacing(4),
            "paddingRight": theme.spacing(4)
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
