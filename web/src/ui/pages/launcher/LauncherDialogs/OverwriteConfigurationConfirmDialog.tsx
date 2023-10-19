import { useState, memo } from "react";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "ui/theme";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
    evtOpen: NonPostableEvt<{
        friendlyName: string;
        resolveDoOverwriteConfiguration: (doOverwriteConfiguration: boolean) => void;
    }>;
};

export const OverwriteConfigurationConfirmDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ OverwriteConfigurationConfirmDialog });

    const [state, setState] = useState<UnpackEvt<typeof evtOpen> | undefined>(undefined);

    useEvt(ctx => evtOpen.attach(ctx, setState), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([doOverwriteConfiguration]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoOverwriteConfiguration(doOverwriteConfiguration);

        setState(undefined);
    });

    return (
        <Dialog
            title={t("should overwrite configuration dialog title")}
            subtitle={t("should overwrite configuration dialog subtitle", {
                "friendlyName": state?.friendlyName ?? ""
            })}
            body={t("should overwrite configuration dialog body")}
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} autoFocus variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        {t("replace")}
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
        />
    );
});

OverwriteConfigurationConfirmDialog.displayName = symToStr({
    OverwriteConfigurationConfirmDialog
});

export const { i18n } = declareComponentKeys<
    | "should overwrite configuration dialog title"
    | { K: "should overwrite configuration dialog subtitle"; P: { friendlyName: string } }
    | "should overwrite configuration dialog body"
    | "cancel"
    | "replace"
>()({ OverwriteConfigurationConfirmDialog });
