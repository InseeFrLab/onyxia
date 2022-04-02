import { memo } from "react";
import { makeStyles, Text } from "ui/theme";
import { useDomRect } from "powerhooks/useDomRect";
import { useTranslation } from "ui/i18n/useTranslations";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { ExplorerIcon } from "../ExplorerIcon";

export type Props = {
    className?: string;
    basename: string;
    percentUploaded: number;
    /** In bytes */
    fileSize: number;
};

export const ExplorerUploadProgress = memo((props: Props) => {
    const { className, basename, percentUploaded, fileSize } = props;

    const {
        ref: progressBarRef,
        domRect: { width: progressBarWidth },
    } = useDomRect();

    const { classes, cx } = useStyles({ percentUploaded, progressBarWidth });

    const { t } = useTranslation({ ExplorerUploadProgress });

    return (
        <div className={cx(classes.root, className)}>
            <ExplorerIcon iconId="data" hasShadow={true} className={classes.icon} />
            <div className={classes.payload}>
                <Text typo="label 1">{basename}</Text>
                <div ref={progressBarRef} className={classes.progressBar}>
                    <div className={classes.progressBarGauge} />
                </div>
                <div className={classes.metric}>
                    <Text typo="body 2">
                        {fileSizePrettyPrint(fileSize * (percentUploaded / 100))}
                        &nbsp;
                        {t("over")}
                        &nbsp;
                        {fileSizePrettyPrint(fileSize)}
                    </Text>

                    <div style={{ "flex": 1 }} />

                    <Text typo="body 2" color="focus">
                        {t("importing")}... &nbsp;
                        {percentUploaded}%
                    </Text>
                </div>
            </div>
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
        },
        "icon": {
            "width": 58,
            ...theme.spacing.rightLeft("margin", 3),
        },
        "payload": {
            "flex": 1,
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
        "metric": {
            "display": "flex",
        },
    }),
);
