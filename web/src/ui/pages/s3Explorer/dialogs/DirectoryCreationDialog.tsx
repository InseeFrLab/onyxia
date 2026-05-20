import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { getIconUrlByName } from "lazy-icons";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogTextInput,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";

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
        exclude: string[];
        resolveDoProceed: (result: DirectoryCreationDialogResult) => void;
    }>;
};

function getDefaultPrefixSegment(params: { exclude: string[] }): string {
    const { exclude } = params;

    const prefixBase = "untitled_folder";
    const excludedNames = new Set(exclude);

    if (!excludedNames.has(prefixBase)) {
        return prefixBase;
    }

    for (let i = 1; ; i++) {
        const prefixSegment = `${prefixBase}_${i}`;

        if (!excludedNames.has(prefixSegment)) {
            return prefixSegment;
        }
    }
}

function getIsValidValue(params: {
    value: string;
    exclude: string[];
    t: ReturnType<typeof useTranslation>["t"];
}): ReturnType<NonNullable<TextFieldProps["getIsValidValue"]>> {
    const { value, exclude, t } = params;

    const normalizedValue = value.trim();

    if (normalizedValue === "") {
        return {
            isValidValue: false,
            message: t("directoryName textField empty error")
        };
    }

    if (exclude.includes(normalizedValue)) {
        return {
            isValidValue: false,
            message: t("directoryName textField duplicate error")
        };
    }

    return {
        isValidValue: true
    };
}

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

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => {
                const prefixSegment = getDefaultPrefixSegment({
                    exclude: eventData.exclude
                });

                setState({
                    ...eventData,
                    prefixSegment,
                    isPrefixSegmentValid: true
                });
            });
        },
        [evtOpen]
    );

    const { classes } = useStyles();
    const dialogClasses = useS3DialogClasses();

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
            className={dialogClasses.paper}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            title={t("create prefix dialog title")}
            subtitle={t("create prefix dialog subtitle")}
            classes={{
                title: dialogClasses.title,
                subtitle: dialogClasses.subtitle,
                body: dialogClasses.body,
                buttons: dialogClasses.buttons
            }}
            body={
                state !== undefined && (
                    <div className={classes.body}>
                        <S3DialogTextInput
                            label={t("prefixName textField label")}
                            value={state.prefixSegment}
                            autoFocus={true}
                            isStrong={true}
                            error={(() => {
                                const result = getIsValidValue({
                                    value: state.prefixSegment,
                                    exclude: state.exclude,
                                    t
                                });

                                return result.isValidValue ? undefined : result.message;
                            })()}
                            onChange={value => {
                                const result = getIsValidValue({
                                    value,
                                    exclude: state.exclude,
                                    t
                                });

                                setState(state => {
                                    assert(state !== undefined);

                                    return {
                                        ...state,
                                        prefixSegment: value,
                                        isPrefixSegmentValid: result.isValidValue
                                    };
                                });
                            }}
                            onEnterKeyDown={() => {
                                if (state.isPrefixSegmentValid) {
                                    submit();
                                }
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
                        startIcon={getIconUrlByName("CreateNewFolderOutlined")}
                    >
                        {t("create prefix")}
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
    | "create prefix dialog title"
    | "create prefix dialog subtitle"
    | "directoryName textField label"
    | "prefixName textField label"
    | "directoryName textField empty error"
    | "directoryName textField duplicate error"
    | "cancel"
    | "create"
    | "create prefix"
>()({ DirectoryCreationDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ DirectoryCreationDialog }).create(() => ({
    body: {
        minWidth: 520,
        width: "100%"
    }
}));
