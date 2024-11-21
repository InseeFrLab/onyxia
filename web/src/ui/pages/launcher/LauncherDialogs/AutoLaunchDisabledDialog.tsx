import { useState, memo } from "react";
import { useStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import { type NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Dialog } from "onyxia-ui/Dialog";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { symToStr } from "tsafe/symToStr";

export type Props = {
    evtOpen: NonPostableEvt<void>;
};

export const AutoLaunchDisabledDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ AutoLaunchDisabledDialog });

    const [isOpen, setIsOpen] = useState(false);

    const { css, theme } = useStyles();

    useEvt(ctx => evtOpen.attach(ctx, () => setIsOpen(true)), [evtOpen]);

    return (
        <Dialog
            isOpen={isOpen}
            title={t("auto launch disabled dialog title")}
            body={
                <Text
                    typo="body 2"
                    htmlComponent="div"
                    className={css({
                        marginTop: theme.spacing(3)
                    })}
                >
                    {t("auto launch disabled dialog body")}
                </Text>
            }
            buttons={
                <>
                    <Button autoFocus onClick={() => setIsOpen(false)}>
                        {t("ok")}
                    </Button>
                </>
            }
            onClose={() => setIsOpen(false)}
        />
    );
});

AutoLaunchDisabledDialog.displayName = symToStr({ AutoLaunchDisabledDialog });

const { i18n } = declareComponentKeys<
    | "auto launch disabled dialog title"
    | {
          K: "auto launch disabled dialog body";
          R: JSX.Element;
      }
    | "ok"
>()({ AutoLaunchDisabledDialog });
export type I18n = typeof i18n;
