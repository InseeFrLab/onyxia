import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import { Evt, type UnpackEvt } from "evt";
import { useEvt, useRerenderOnStateChange } from "evt/hooks";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { tss } from "tss";
import { useConst } from "powerhooks/useConst";
import * as runExclusive from "run-exclusive";

export type ConfirmOverwriteDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        resolveResponse: (params: { doOverwrite: boolean }) => void;
    }>;
};

export const ConfirmOverwriteDialog = memo((props: ConfirmOverwriteDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ ConfirmOverwriteDialog });
    const { classes } = useStyles();

    const evtState = useConst(() =>
        Evt.create<UnpackEvt<ConfirmOverwriteDialogProps["evtOpen"]> | undefined>(
            undefined
        )
    );

    useRerenderOnStateChange(evtState);

    useEvt(
        ctx => {
            evtOpen.attach(
                ctx,
                runExclusive.build(async eventData => {
                    await evtState.waitFor(state => state === undefined);

                    if (ctx.completionStatus !== undefined) {
                        return;
                    }

                    evtState.state = eventData;
                })
            );
        },
        [evtOpen]
    );

    const close = (doOverwrite: boolean) => {
        assert(evtState.state !== undefined);

        evtState.state.resolveResponse({ doOverwrite });

        evtState.state = undefined;
    };

    return (
        <Dialog
            title={t("dialog title")}
            subtitle={
                evtState.state === undefined ? (
                    ""
                ) : (
                    <span className={classes.s3Uri}>
                        {stringifyS3Uri(evtState.state.s3Uri)}
                    </span>
                )
            }
            body={t("dialog body")}
            maxWidth="md"
            fullWidth={true}
            classes={{
                subtitle: classes.subtitle
            }}
            buttons={
                <>
                    <Button onClick={() => close(false)} autoFocus variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button onClick={() => close(true)} autoFocus>
                        {t("overwrite")}
                    </Button>
                </>
            }
            isOpen={evtState.state !== undefined}
            onClose={() => close(false)}
        />
    );
});

ConfirmOverwriteDialog.displayName = symToStr({
    ConfirmOverwriteDialog
});

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "cancel" | "overwrite"
>()({ ConfirmOverwriteDialog });

export type I18n = typeof i18n;

const useStyles = tss.withName({ ConfirmOverwriteDialog }).create({
    subtitle: {
        maxWidth: "100%"
    },
    s3Uri: {
        display: "block",
        maxWidth: "100%",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
    }
});
