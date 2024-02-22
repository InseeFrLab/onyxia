import { useMemo, memo, useReducer, useRef } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { assert } from "tsafe/assert";
import { useDomRect } from "powerhooks/useDomRect";
import { useConstCallback } from "powerhooks/useConstCallback";

type Props = {
    className?: string;
    openUrl: string;
    servicePassword: string | undefined;
    onDialogClose: () => void;
};

export const CopyOpenButton = memo((props: Props) => {
    const { openUrl, servicePassword, onDialogClose, className } = props;

    const [isReadyToOpen, setReadyToOpen] = useReducer(
        () => true,
        servicePassword === undefined ? true : false
    );

    const copyPasswordToClipBoard = useConstCallback(() => {
        assert(servicePassword !== undefined);
        navigator.clipboard.writeText(servicePassword);
        setReadyToOpen();
    });

    const { ref1, ref2, largerButtonWidth } = (function useClosure() {
        const {
            ref: ref1,
            domRect: { width: width1 }
        } = useDomRect();
        const {
            ref: ref2,
            domRect: { width: width2 }
        } = useDomRect();

        const refWidth = useRef<number>(0);

        const currWidth = width1 === 0 || width2 === 0 ? 0 : Math.max(width1, width2);

        if (currWidth > refWidth.current) {
            refWidth.current = currWidth;
        }

        return {
            ref1,
            ref2,
            "largerButtonWidth": refWidth.current
        };
    })();

    const { classes, cx } = useStyles({ largerButtonWidth });

    const buttonProps = useMemo(
        () =>
            ({
                "variant": "primary",
                "href": isReadyToOpen ? openUrl : undefined,
                "doOpenNewTabIfHref": true,
                "onClick": isReadyToOpen ? onDialogClose : copyPasswordToClipBoard
            }) as const,
        [isReadyToOpen]
    );

    const { t } = useTranslation({ CopyOpenButton });

    return (
        <div className={cx(classes.root, className)}>
            <Button
                startIcon="key"
                ref={ref2}
                className={cx(classes.button, { [classes.collapsed]: isReadyToOpen })}
                {...buttonProps}
            >
                {t("first copy the password")}
            </Button>
            <Button
                ref={ref1}
                className={cx(classes.button, {
                    [classes.collapsed]: !isReadyToOpen
                })}
                {...buttonProps}
            >
                {t("open the service")}
            </Button>
        </div>
    );
});

const useStyles = tss
    .withParams<{ largerButtonWidth: number }>()
    .withName({ CopyOpenButton })
    .create(({ largerButtonWidth }) => ({
        "root": {
            "position": "relative",
            "opacity": largerButtonWidth === 0 ? 0 : 1,
            "transition": `opacity ease-in-out 250ms`
        },
        "button": {
            "minWidth": largerButtonWidth
        },
        "collapsed": {
            "position": "fixed",
            "top": 3000
        }
    }));

export const { i18n } = declareComponentKeys<
    "first copy the password" | "open the service"
>()({ CopyOpenButton });
