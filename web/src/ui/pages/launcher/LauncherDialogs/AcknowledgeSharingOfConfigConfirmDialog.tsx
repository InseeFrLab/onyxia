import { useState, memo } from "react";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
    evtOpen: NonPostableEvt<{
        groupProjectName: string;
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const AcknowledgeSharingOfConfigConfirmDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ AcknowledgeSharingOfConfigConfirmDialog });

    const [state, setState] = useState<UnpackEvt<typeof evtOpen> | undefined>(undefined);

    useEvt(ctx => evtOpen.attach(ctx, setState), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([doProceed]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoProceed(doProceed);

        setState(undefined);
    });

    return (
        <Dialog
            title={t("acknowledge sharing of config confirm dialog title")}
            subtitle={t("acknowledge sharing of config confirm dialog subtitle", {
                groupProjectName: state?.groupProjectName ?? ""
            })}
            body={t("acknowledge sharing of config confirm dialog body")}
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} autoFocus variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        {t("i understand, proceed")}
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
        />
    );
});

AcknowledgeSharingOfConfigConfirmDialog.displayName = symToStr({
    AcknowledgeSharingOfConfigConfirmDialog
});

const { i18n } = declareComponentKeys<
    | "acknowledge sharing of config confirm dialog title"
    | {
          K: "acknowledge sharing of config confirm dialog subtitle";
          P: { groupProjectName: string };
      }
    | "acknowledge sharing of config confirm dialog body"
    | "cancel"
    | "i understand, proceed"
>()({ AcknowledgeSharingOfConfigConfirmDialog });
export type I18n = typeof i18n;
