import { useState, memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Tooltip } from "onyxia-ui/Tooltip";
import { IconButton } from "onyxia-ui/IconButton";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";
import { useStateRef } from "powerhooks/useStateRef";
import { tss } from "tss";

type Props = {
    className?: string;
    copyToClipboardText?: string;
    copiedToClipboardText?: string;
    textToCopy: string;
    /** Default: false */
    disabled?: boolean;
};

export const CopyToClipboardIconButton = memo((props: Props) => {
    const {
        className,
        textToCopy,
        copiedToClipboardText = "Copy to clipboard",
        copyToClipboardText = "Copied!",
        disabled = false
    } = props;

    //const { ref } = useDomRect();

    const ref = useStateRef(null);

    const { isCopyFeedbackOn, onClick } = (function useClosure() {
        const [isCopyFeedbackOn, setIsCopyFeedbackOn] = useState(false);

        const onClick = useConstCallback(() => {
            navigator.clipboard.writeText(textToCopy);

            (async () => {
                setIsCopyFeedbackOn(true);

                await new Promise(resolve => setTimeout(resolve, 1000));

                setIsCopyFeedbackOn(false);
            })();
        });

        return { isCopyFeedbackOn, onClick };
    })();

    const { classes, cx, css } = useStyles();

    const size = "small";

    return (
        <Tooltip title={isCopyFeedbackOn ? copyToClipboardText : copiedToClipboardText}>
            <div className={cx(classes.root, className)}>
                {isCopyFeedbackOn ? (
                    <Icon
                        ref={ref}
                        className={classes.check}
                        size={size}
                        icon={id<MuiIconComponentName>("Check")}
                    />
                ) : (
                    <IconButton
                        className={css({ "width": 0 })}
                        icon={id<MuiIconComponentName>("FilterNone")}
                        onClick={onClick}
                        size={size}
                        disabled={disabled}
                    />
                )}
            </div>
        </Tooltip>
    );
});

const useStyles = tss.withName({ CopyToClipboardIconButton }).create(({ theme }) => ({
    "root": {
        //"width": theme.spacing(2)
    },
    "check": {
        "color": theme.colors.useCases.alertSeverity.success.main
    }
}));
