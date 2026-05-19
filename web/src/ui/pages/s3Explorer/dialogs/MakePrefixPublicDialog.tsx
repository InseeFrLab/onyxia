import { memo, useRef, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { getIconUrlByName } from "lazy-icons";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { tss } from "tss";

export type MakePrefixPublicDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.TerminatedByDelimiter;
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const MakePrefixPublicDialog = memo((props: MakePrefixPublicDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ MakePrefixPublicDialog });
    const { classes } = useStyles();

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

    return (
        <Dialog
            title={t("dialog title")}
            body={
                state === undefined
                    ? ""
                    : t("dialog body", {
                          s3Uri: stringifyS3Uri(state.s3Uri),
                          s3UriClassName: classes.s3Uri
                      })
            }
            buttons={
                <>
                    <Button autoFocus variant="secondary" onClick={() => close(false)}>
                        {t("cancel")}
                    </Button>
                    <Button
                        startIcon={getIconUrlByName("Public")}
                        onClick={() => close(true)}
                    >
                        {t("make public")}
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
    | {
          K: "dialog body";
          P: { s3Uri: string; s3UriClassName: string };
          R: JSX.Element;
      }
    | "cancel"
    | "make public"
>()({ MakePrefixPublicDialog });

export type I18n = typeof i18n;

const useStyles = tss.withName({ MakePrefixPublicDialog }).create({
    s3Uri: {
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
    }
});
