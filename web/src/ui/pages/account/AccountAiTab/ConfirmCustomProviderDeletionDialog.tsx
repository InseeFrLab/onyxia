import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";

export type Props = {
    evtOpen: NonPostableEvt<{
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const ConfirmCustomProviderDeletionDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ ConfirmCustomProviderDeletionDialog });
    const { classes } = useStyles();

    const [state, setState] = useState<UnpackEvt<typeof evtOpen> | undefined>(undefined);

    useEvt(ctx => evtOpen.attach(ctx, setState), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([doProceed]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoProceed(doProceed);
        setState(undefined);
    });

    return (
        <Dialog
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
            maxWidth={false}
            className={classes.paper}
            title={t("dialog title")}
            body={t("dialog body")}
            buttons={
                <>
                    <Button
                        variant="secondary"
                        autoFocus={true}
                        onClick={onCloseFactory(false)}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        startIcon={getIconUrlByName("Delete")}
                        variant="primary"
                        onClick={onCloseFactory(true)}
                    >
                        {t("delete provider")}
                    </Button>
                </>
            }
        />
    );
});

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "cancel" | "delete provider"
>()({ ConfirmCustomProviderDeletionDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ConfirmCustomProviderDeletionDialog }).create(() => ({
    paper: {
        width: 650,
        maxWidth: "calc(100vw - 48px)",
        borderRadius: 12
    }
}));
