import { memo, useRef, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { getIconUrlByName } from "lazy-icons";
import { type S3Uri } from "core/tools/S3Uri";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { tss } from "tss";
import { useS3DialogClasses } from "ui/shared/codex/S3DialogPrimitives";

export type PrefixPolicyAction = "make public" | "undo make public";

export type MakePrefixPublicDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.TerminatedByDelimiter;
        action?: PrefixPolicyAction;
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const MakePrefixPublicDialog = memo((props: MakePrefixPublicDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ MakePrefixPublicDialog });
    const { classes } = useStyles();
    const dialogClasses = useS3DialogClasses();

    const [state, setState] = useState<
        UnpackEvt<MakePrefixPublicDialogProps["evtOpen"]> | undefined
    >(undefined);
    const stateRef = useRef<typeof state>(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => {
                stateRef.current?.resolveDoProceed(false);
                stateRef.current = eventData;
                setState(eventData);
            });
        },
        [evtOpen]
    );

    const close = (doProceed: boolean) => {
        const state = stateRef.current;

        if (state === undefined) {
            return;
        }

        stateRef.current = undefined;
        setState(undefined);

        state.resolveDoProceed(doProceed);
    };

    const action = state?.action ?? "make public";
    const isMakePublic = action === "make public";

    return (
        <Dialog
            className={dialogClasses.paper}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            title={
                isMakePublic
                    ? t("make public dialog title")
                    : t("make private dialog title")
            }
            classes={{
                title: dialogClasses.title,
                body: dialogClasses.body,
                buttons: dialogClasses.buttons
            }}
            body={
                state === undefined ? undefined : (
                    <div className={classes.body}>
                        {isMakePublic ? (
                            <>
                                <p>{t("make public dialog body main")}</p>
                                <p>{t("make public dialog body alternative")}</p>
                            </>
                        ) : (
                            <>
                                <p>{t("make private dialog body main")}</p>
                                <p>{t("make private dialog body alternative")}</p>
                            </>
                        )}
                    </div>
                )
            }
            buttons={
                <>
                    <Button autoFocus variant="secondary" onClick={() => close(false)}>
                        {t("cancel")}
                    </Button>
                    <Button
                        startIcon={getIconUrlByName(
                            isMakePublic ? "Public" : "PublicOff"
                        )}
                        onClick={() => close(true)}
                    >
                        {isMakePublic ? t("make public") : t("make private")}
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={() => close(false)}
        />
    );
});

MakePrefixPublicDialog.displayName = symToStr({
    MakePrefixPublicDialog
});

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "make public dialog title"
    | "make private dialog title"
    | "make public dialog body main"
    | "make public dialog body alternative"
    | "make private dialog body main"
    | "make private dialog body alternative"
    | {
          K: "dialog body";
          P: { s3Uri: string; s3UriClassName: string };
          R: JSX.Element;
      }
    | "cancel"
    | "make public"
    | "make private"
>()({ MakePrefixPublicDialog });

export type I18n = typeof i18n;

const useStyles = tss.withName({ MakePrefixPublicDialog }).create(({ theme }) => ({
    body: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        minWidth: 520,
        lineHeight: 1.5,
        "& p": {
            margin: 0
        }
    }
}));
