import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type DisplayErrorDialogProps = {
    evtOpen: Evt<{
        errorMessage: string;
    }>;
};

export const DisplayErrorDialog = memo((props: DisplayErrorDialogProps) => {
    const { evtOpen } = props;
    const { t } = useTranslation({ DisplayErrorDialog });

    const [state, setState] = useState<
        UnpackEvt<DisplayErrorDialogProps["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => setState(eventData));
        },
        [evtOpen]
    );

    return (
        <Dialog
            title={t("error")}
            body={state?.errorMessage ?? ""}
            buttons={
                <Button autoFocus onClick={() => setState(undefined)}>
                    {t("ok")}
                </Button>
            }
            isOpen={state !== undefined}
            onClose={() => setState(undefined)}
        />
    );
});

DisplayErrorDialog.displayName = symToStr({
    DisplayErrorDialog
});

const { i18n } = declareComponentKeys<"error" | "ok">()({ DisplayErrorDialog });
export type I18n = typeof i18n;
