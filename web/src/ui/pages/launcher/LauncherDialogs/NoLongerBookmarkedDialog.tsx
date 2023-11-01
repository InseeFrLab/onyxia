import { useState, memo } from "react";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
    evtOpen: NonPostableEvt<void>;
};

export const NoLongerBookmarkedDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ NoLongerBookmarkedDialog });

    const [isOpen, setIsOpen] = useState(false);

    useEvt(ctx => evtOpen.attach(ctx, () => setIsOpen(true)), [evtOpen]);

    return (
        <Dialog
            title={t("no longer bookmarked dialog title")}
            body={t("no longer bookmarked dialog body")}
            buttons={
                <Button onClick={() => setIsOpen(false)} autoFocus>
                    {t("ok")}
                </Button>
            }
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );
});

NoLongerBookmarkedDialog.displayName = symToStr({ NoLongerBookmarkedDialog });

export const { i18n } = declareComponentKeys<
    "no longer bookmarked dialog title" | "no longer bookmarked dialog body" | "ok"
>()({ NoLongerBookmarkedDialog });
