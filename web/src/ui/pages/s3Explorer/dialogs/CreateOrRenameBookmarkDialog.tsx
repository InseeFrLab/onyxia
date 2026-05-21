import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogTextInput,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";

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

    if (s3Uri.keySegments.length <= 1) {
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

        const { t } = useTranslation({ CreateOrRenameBookmarkDialog });

        const [state, setState] = useState<
            | (UnpackEvt<CreateOrRenameBookmarkDialogProps["evtOpen"]> & {
                  displayName: string;
                  isDisplayNameValid: boolean;
              })
            | undefined
        >(undefined);

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
        const dialogClasses = useS3DialogClasses();

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
                className={dialogClasses.paper}
                maxWidth={false}
                muiDialogClasses={{ root: dialogClasses.overlayRoot }}
                title={
                    state?.currentDisplayName === undefined
                        ? t("add dialog title")
                        : t("rename dialog title")
                }
                subtitle={t("dialog subtitle")}
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
                                label={t("bookmarkName textField label")}
                                value={state.displayName}
                                autoFocus={true}
                                isStrong={true}
                                error={
                                    state.isDisplayNameValid
                                        ? undefined
                                        : t("bookmarkName textField empty error")
                                }
                                onChange={value =>
                                    setState(state => {
                                        assert(state !== undefined);

                                        return {
                                            ...state,
                                            displayName: value,
                                            isDisplayNameValid: value.trim() !== ""
                                        };
                                    })
                                }
                                onEnterKeyDown={() => {
                                    if (state.isDisplayNameValid) {
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
                            onClick={state?.isDisplayNameValid ? submit : undefined}
                            disabled={!state?.isDisplayNameValid}
                            startIcon={getIconUrlByName("StarBorder")}
                        >
                            {state?.currentDisplayName === undefined
                                ? t("add to bookmarks")
                                : t("rename bookmark")}
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

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "add dialog title"
    | "rename dialog title"
    | "dialog subtitle"
    | "bookmarkName textField label"
    | "bookmarkName textField empty error"
    | "copy s3 path aria label"
    | "cancel"
    | "ok"
    | "add to bookmarks"
    | "rename bookmark"
>()({ CreateOrRenameBookmarkDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ CreateOrRenameBookmarkDialog }).create(({ theme }) => ({
    body: {
        minWidth: 520,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5)
    }
}));
