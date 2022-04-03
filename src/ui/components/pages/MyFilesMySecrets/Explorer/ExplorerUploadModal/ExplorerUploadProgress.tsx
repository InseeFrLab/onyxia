import { useMemo, memo } from "react";
import { makeStyles, Text } from "ui/theme";
import { useDomRect } from "powerhooks/useDomRect";
import { useTranslation } from "ui/i18n/useTranslations";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { ExplorerIcon } from "../ExplorerIcon";
import { IconButton } from "ui/theme";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    basename: string;
    percentUploaded: number;
    /** In bytes */
    fileSize: number;
} & (
    | {
          isFailed: true;
          onClick: (action: "clear" | "restart") => void;
      }
    | {
          isFailed: false;
      }
);

export const ExplorerUploadProgress = memo((props: Props) => {
    const { className, basename, percentUploaded, fileSize, ...rest } = props;

    const {
        ref: progressBarRef,
        domRect: { width: progressBarWidth },
    } = useDomRect();

    const { classes, cx } = useStyles({ percentUploaded, progressBarWidth });

    const { t } = useTranslation({ ExplorerUploadProgress });

    const onClickFactory = useCallbackFactory(([action]: ["clear" | "restart"]) => {
        assert(rest.isFailed);

        rest.onClick(action);
    });

    return (
        <div className={cx(classes.root, className)}>
            <ExplorerIcon iconId="data" hasShadow={true} className={classes.icon} />
            <div className={classes.payload}>
                <Text typo="label 1">{basename}</Text>
                {!rest.isFailed && (
                    <div ref={progressBarRef} className={classes.progressBar}>
                        <div className={classes.progressBarGauge} />
                    </div>
                )}
                <div className={classes.metric}>
                    <AdvancementText
                        percentUploaded={percentUploaded}
                        fileSize={fileSize}
                    />
                    {!rest.isFailed && (
                        <>
                            <div style={{ "flex": 1 }} />
                            <Text typo="body 2" color="focus">
                                {t("importing")}...
                            </Text>
                            <Text
                                typo="body 2"
                                color="focus"
                                fixedSize_enabled={true}
                                fixedSize_content="100%"
                            >
                                {percentUploaded}%
                            </Text>
                        </>
                    )}
                </div>
            </div>
            {props.isFailed && (
                <div style={{ "display": "flex" }}>
                    <IconButton
                        iconId="close"
                        className={classes.closeIconButton}
                        onClick={onClickFactory("clear")}
                    />
                    <IconButton iconId="refresh" onClick={onClickFactory("restart")} />
                </div>
            )}
        </div>
    );
});

export declare namespace ExplorerUploadProgress {
    export type I18nScheme = {
        "over": undefined;
        "importing": undefined;
    };
}

const useStyles = makeStyles<
    Pick<Props, "percentUploaded"> & { progressBarWidth: number }
>({ "name": { ExplorerUploadProgress } })(
    (theme, { percentUploaded, progressBarWidth }) => ({
        "root": {
            "display": "flex",
            "paddingRight": theme.spacing(4),
        },
        "icon": {
            "width": 50,
            ...theme.spacing.rightLeft("margin", 4),
        },
        "payload": {
            "flex": 1,
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "space-between",
            ...theme.spacing.topBottom("padding", 3),
        },
        "progressBar": {
            "position": "relative",
            "boxSizing": "border-box",
            "height": 4,
            "backgroundColor": theme.colors.useCases.typography.textTertiary,
            "borderRadius": 5,
            ...theme.spacing.topBottom("margin", 2),
        },
        "progressBarGauge": {
            "position": "absolute",
            "width": (percentUploaded / 100) * progressBarWidth,
            "boxSizing": "border-box",
            "borderRadius": 5,
            "height": 4,
            "backgroundColor": theme.colors.useCases.buttons.actionActive,
        },
        "closeIconButton": {
            "& svg": {
                "color": theme.colors.useCases.alertSeverity.error.main,
            },
        },
        "metric": {
            "display": "flex",
        },
    }),
);

const { AdvancementText } = (() => {
    type Props = {
        className?: string;
        percentUploaded: number;
        /** In bytes */
        fileSize: number;
    };

    const AdvancementText = memo((props: Props) => {
        const { className, percentUploaded, fileSize } = props;

        const { t } = useTranslation({ ExplorerUploadProgress });

        const { current, total } = useMemo(() => {
            const total = fileSizePrettyPrint({
                "bytes": fileSize,
            });

            const current = fileSizePrettyPrint({
                "bytes": fileSize * (percentUploaded / 100),
                "unit": total.unit,
            });

            return { total, current };
        }, [fileSize, percentUploaded]);

        const { classes, cx } = useStyle();

        return (
            <div className={cx(classes.root, className)}>
                <Text
                    typo="body 2"
                    fixedSize_enabled={true}
                    fixedSize_content={total.value + "_"}
                >
                    {current.value}
                </Text>
                <Text typo="body 2">
                    {current.unit}
                    &nbsp;
                    {t("over")}
                    &nbsp;
                    {total.value}
                    &nbsp;
                    {total.unit}
                </Text>
            </div>
        );
    });

    const useStyle = makeStyles()({
        "root": {
            "display": "flex",
        },
    });

    return { AdvancementText };
})();
