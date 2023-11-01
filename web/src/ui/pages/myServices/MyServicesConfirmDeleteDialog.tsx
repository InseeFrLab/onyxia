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
        isThereOwnedSharedServices: boolean;
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const MyServicesConfirmDeleteDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ MyServicesConfirmDeleteDialog });

    const [state, setState] = useState<UnpackEvt<typeof evtOpen> | undefined>(undefined);

    useEvt(ctx => evtOpen.attach(ctx, setState), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([doProceed]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoProceed(doProceed);

        setState(undefined);
    });

    return (
        <Dialog
            title={t("confirm delete title")}
            subtitle={t("confirm delete subtitle")}
            body={`${
                state?.isThereOwnedSharedServices
                    ? t("confirm delete body shared services")
                    : ""
            } ${t("confirm delete body")}`}
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        {t("confirm")}
                    </Button>
                </>
            }
        />
    );
});

MyServicesConfirmDeleteDialog.displayName = symToStr({
    MyServicesConfirmDeleteDialog
});

export const { i18n } = declareComponentKeys<
    | "confirm delete title"
    | "confirm delete subtitle"
    | "confirm delete body"
    | "confirm delete body shared services"
    | "cancel"
    | "confirm"
>()({ MyServicesConfirmDeleteDialog });
