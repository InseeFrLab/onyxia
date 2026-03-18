import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import type { Evt, UnpackEvt } from "evt";
import { Evt as EvtConstructor } from "evt";
import { useEvt } from "evt/hooks";
import { useConst } from "powerhooks/useConst";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { tss } from "tss";

export type CreateOrRenameBookmarkDialogResult =
    | {
          doProceed: true;
          displayName: string;
      }
    | {
          doProceed: false;
      };

export type CreateOrRenameBookmarkDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri;
        currentDisplayName: string | undefined;
        resolveDoProceed: (result: CreateOrRenameBookmarkDialogResult) => void;
    }>;
};

function getDefaultDisplayName(props: { s3Uri: S3Uri }): string {
    const { s3Uri } = props;

    if (s3Uri.keySegments.length <= 2) {
        return stringifyS3Uri(s3Uri).slice("s3://".length);
    }

    return [
        s3Uri.keySegments.at(-2),
        s3Uri.keySegments.at(-1),
        ...(s3Uri.isDelimiterTerminated ? [""] : [])
    ].join(s3Uri.delimiter);
}

export const CreateOrRenameBookmarkDialog = memo(
    (props: CreateOrRenameBookmarkDialogProps) => {
        const { evtOpen } = props;

        const [state, setState] = useState<
            | (UnpackEvt<CreateOrRenameBookmarkDialogProps["evtOpen"]> & {
                  displayName: string;
                  isDisplayNameValid: boolean;
              })
            | undefined
        >(undefined);

        const evtTextFieldAction = useConst(() =>
            EvtConstructor.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
        );

        useEvt(
            ctx => {
                evtOpen.attach(ctx, eventData => {
                    const displayName =
                        eventData.currentDisplayName ??
                        getDefaultDisplayName({
                            s3Uri: eventData.s3Uri
                        });

                    setState({
                        ...eventData,
                        displayName,
                        isDisplayNameValid: displayName.trim() !== ""
                    });
                });
            },
            [evtOpen]
        );

        const { classes } = useStyles();

        const close = (result: CreateOrRenameBookmarkDialogResult) => {
            setState(state => {
                assert(state !== undefined);

                state.resolveDoProceed(result);

                return undefined;
            });
        };

        const submit = () => {
            assert(state !== undefined);
            assert(state.isDisplayNameValid);

            close({
                doProceed: true,
                displayName: state.displayName.trim()
            });
        };

        return (
            <Dialog
                title="Bookmark Name"
                subtitle={state === undefined ? "" : stringifyS3Uri(state.s3Uri)}
                classes={{
                    body: classes.dialogBody
                }}
                body={
                    state !== undefined && (
                        <div className={classes.body}>
                            <TextField
                                className={classes.textField}
                                inputProps_autoFocus={true}
                                selectAllTextOnFocus={true}
                                label="Name"
                                defaultValue={state.displayName}
                                getIsValidValue={value => {
                                    const normalizedValue = value.trim();

                                    if (normalizedValue === "") {
                                        return {
                                            isValidValue: false,
                                            message: "Bookmark name can't be empty"
                                        };
                                    }

                                    return {
                                        isValidValue: true
                                    };
                                }}
                                onValueBeingTypedChange={({ value, isValidValue }) =>
                                    setState(state => {
                                        assert(state !== undefined);

                                        return {
                                            ...state,
                                            displayName: value,
                                            isDisplayNameValid: isValidValue
                                        };
                                    })
                                }
                                evtAction={evtTextFieldAction}
                                onEnterKeyDown={({
                                    preventDefaultAndStopPropagation
                                }) => {
                                    preventDefaultAndStopPropagation();

                                    if (!state?.isDisplayNameValid) {
                                        return;
                                    }

                                    evtTextFieldAction.post("TRIGGER SUBMIT");
                                }}
                                onSubmit={() => {
                                    submit();
                                }}
                            />
                        </div>
                    )
                }
                buttons={
                    <>
                        <Button
                            onClick={() => close({ doProceed: false })}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={state?.isDisplayNameValid ? submit : undefined}
                            disabled={!state?.isDisplayNameValid}
                        >
                            Ok
                        </Button>
                    </>
                }
                isOpen={state !== undefined}
                onClose={() => close({ doProceed: false })}
            />
        );
    }
);

CreateOrRenameBookmarkDialog.displayName = symToStr({
    CreateOrRenameBookmarkDialog
});

const useStyles = tss.withName({ CreateOrRenameBookmarkDialog }).create(({ theme }) => ({
    dialogBody: {
        width: "100%"
    },
    body: {
        minWidth: 320,
        width: "100%",
        paddingTop: theme.spacing(2)
        /*
        "& .MuiTextField-root": {
            width: "100%"
        }
            */
    },
    textField: {
        width: "100%"
    }
}));
