import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    evtOpen: Evt<{
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const ConfirmCustomS3ConfigDeletionDialog = memo((props: Props) => {
    const { evtOpen } = props;
    const { t } = useTranslation({ ConfirmCustomS3ConfigDeletionDialog });

    const [state, setState] = useState<UnpackEvt<Props["evtOpen"]> | undefined>(
        undefined
    );

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ resolveDoProceed }) => setState({ resolveDoProceed }));
        },
        [evtOpen]
    );

    const onCloseFactory = useCallbackFactory(([doProceed]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoProceed(doProceed);

        setState(undefined);
    });

    return (
        <Dialog
            title={t("dialog title")}
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} autoFocus variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        {t("yes")}
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
        />
    );
});

ConfirmCustomS3ConfigDeletionDialog.displayName = symToStr({
    ConfirmCustomS3ConfigDeletionDialog
});

const { i18n } = declareComponentKeys<"dialog title" | "cancel" | "yes">()({
    ConfirmCustomS3ConfigDeletionDialog
});
export type I18n = typeof i18n;
