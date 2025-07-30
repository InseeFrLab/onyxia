import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { useTranslation, declareComponentKeys } from "ui/i18n";

export type TextFormDialogProps = {
    evtOpen: NonPostableEvt<{
        onResponse: (params: { doNavigateAnyway: boolean }) => void;
    }>;
};

type OpenParams = UnpackEvt<TextFormDialogProps["evtOpen"]>;

export const ConfirmNavigationDialog = memo((props: TextFormDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ ConfirmNavigationDialog });

    const [openState, setOpenState] = useState<
        | {
              onResponse: OpenParams["onResponse"];
          }
        | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ onResponse }) =>
                setOpenState({
                    onResponse
                })
            );
        },
        [evtOpen]
    );

    const onCancel = () => {
        assert(openState !== undefined);
        openState.onResponse({ doNavigateAnyway: false });
        setOpenState(undefined);
    };

    return (
        <Dialog
            title={t("you have unsaved changes")}
            isOpen={openState !== undefined}
            onClose={onCancel}
            buttons={
                <>
                    <Button variant="secondary" onClick={onCancel}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={() => {
                            assert(openState !== undefined);

                            openState.onResponse({ doNavigateAnyway: true });

                            setOpenState(undefined);
                        }}
                    >
                        {t("continue without saving")}
                    </Button>
                </>
            }
        />
    );
});

const { i18n } = declareComponentKeys<
    "you have unsaved changes" | "cancel" | "continue without saving"
>()({
    ConfirmNavigationDialog
});
export type I18n = typeof i18n;
