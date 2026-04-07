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
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type DirectoryCreationDialogResult =
    | {
          doProceed: true;
          prefixSegment: string;
      }
    | {
          doProceed: false;
      };

export type DirectoryCreationDialogProps = {
    evtOpen: Evt<{
        resolveDoProceed: (result: DirectoryCreationDialogResult) => void;
    }>;
};

export const DirectoryCreationDialog = memo((props: DirectoryCreationDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ DirectoryCreationDialog });

    const [state, setState] = useState<
        | (UnpackEvt<DirectoryCreationDialogProps["evtOpen"]> & {
              prefixSegment: string;
              isPrefixSegmentValid: boolean;
          })
        | undefined
    >(undefined);

    const evtTextFieldAction = useConst(() =>
        EvtConstructor.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
    );

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => {
                setState({
                    ...eventData,
                    prefixSegment: "",
                    isPrefixSegmentValid: false
                });
            });
        },
        [evtOpen]
    );

    const { classes } = useStyles();

    const close = (result: DirectoryCreationDialogResult) => {
        setState(state => {
            assert(state !== undefined);

            state.resolveDoProceed(result);

            return undefined;
        });
    };

    const submit = () => {
        assert(state !== undefined);
        assert(state.isPrefixSegmentValid);

        close({
            doProceed: true,
            prefixSegment: state.prefixSegment.trim()
        });
    };

    return (
        <Dialog
            title={t("dialog title")}
            subtitle={t("dialog subtitle")}
            classes={{
                body: classes.dialogBody
            }}
            body={
                state !== undefined && (
                    <div className={classes.body}>
                        <TextField
                            className={classes.textField}
                            inputProps_autoFocus={true}
                            label={t("directoryName textField label")}
                            defaultValue={state.prefixSegment}
                            getIsValidValue={value => {
                                const normalizedValue = value.trim();

                                if (normalizedValue === "") {
                                    return {
                                        isValidValue: false,
                                        message: t("directoryName textField empty error")
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
                                        prefixSegment: value,
                                        isPrefixSegmentValid: isValidValue
                                    };
                                })
                            }
                            evtAction={evtTextFieldAction}
                            onEnterKeyDown={({ preventDefaultAndStopPropagation }) => {
                                preventDefaultAndStopPropagation();

                                if (!state?.isPrefixSegmentValid) {
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
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={state?.isPrefixSegmentValid ? submit : undefined}
                        disabled={!state?.isPrefixSegmentValid}
                    >
                        {t("create")}
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={() => close({ doProceed: false })}
        />
    );
});

DirectoryCreationDialog.displayName = symToStr({
    DirectoryCreationDialog
});

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "dialog subtitle"
    | "directoryName textField label"
    | "directoryName textField empty error"
    | "cancel"
    | "create"
>()({ DirectoryCreationDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ DirectoryCreationDialog }).create(({ theme }) => ({
    dialogBody: {
        width: "100%"
    },
    body: {
        minWidth: 320,
        width: "100%",
        paddingTop: theme.spacing(2)
    },
    textField: {
        width: "100%"
    }
}));
