import CircularProgress from "@mui/material/CircularProgress";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    name: string;
    used: string;
    total: string;
    usagePercentage: number;
    severity: "success" | "warning" | "error";
};

export function CircularUsage(props: Props) {
    const { className, name, used, total, usagePercentage, severity } = props;

    const { t } = useTranslation({ CircularUsage });

    const { cx, classes } = useStyles({
        severity
    });

    const circularProgressSize = 60;

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="label 1">
                {t("quota card title", {
                    "what": name.replace(/^limits\./, "").replace(/^requests\./, ""),
                    "isLimit": name.startsWith("limits")
                })}
            </Text>
            <div className={classes.circularProgressWrapper}>
                <div className={classes.circularProgressInnerWrapper}>
                    <div className={classes.backLayerCircularProgressWrapper}>
                        <CircularProgress
                            size={circularProgressSize}
                            className={classes.backLayerCircularProgress}
                            variant="determinate"
                            value={100}
                        />
                    </div>
                    <CircularProgress
                        size={circularProgressSize}
                        className={classes.circularProgress}
                        variant="determinate"
                        value={usagePercentage}
                    />
                    <div className={classes.percentageWrapper}>
                        <Text typo="body 1">
                            {(() => {
                                if (usagePercentage === 0) {
                                    return 0;
                                }

                                if (usagePercentage < 1) {
                                    return "<1";
                                }

                                return Math.round(usagePercentage);
                            })()}
                            %
                        </Text>
                    </div>
                </div>
            </div>
            <div className={classes.metricsWrapper}>
                <Text typo="label 1">{t("used")}:</Text>&nbsp;
                <Text typo="body 1">{used}</Text>
                <div style={{ "flex": 1 }} />
                <Text typo="label 1">{t("max")}:</Text>&nbsp;
                <Text typo="body 1">{total}</Text>
            </div>
        </div>
    );
}

const useStyles = tss
    .withName({ CircularUsage })
    .withParams<{
        severity: "success" | "info" | "warning" | "error";
    }>()
    .create(({ theme, severity }) => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "borderRadius": theme.spacing(2),
            "padding": theme.spacing(3),
            "boxShadow": theme.shadows[1],
            "&:hover": {
                "boxShadow": theme.shadows[6]
            }
        },
        "circularProgressWrapper": {
            "display": "flex",
            "justifyContent": "center",
            ...theme.spacing.topBottom("margin", 2)
        },
        "circularProgressInnerWrapper": {
            "position": "relative"
        },
        "circularProgress": {
            "verticalAlign": "top",
            "color": theme.colors.useCases.alertSeverity[severity].main,
            "position": "relative"
        },
        "backLayerCircularProgress": {
            "verticalAlign": "top",
            "color": theme.colors.useCases.alertSeverity[severity].background
        },
        "percentageWrapper": {
            "position": "absolute",
            "top": 0,
            "left": 0,
            "bottom": 0,
            "right": 0,
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
        },
        "backLayerCircularProgressWrapper": {
            "position": "absolute",
            "top": 0,
            "left": 0,
            "bottom": 0,
            "right": 0
        },
        "metricsWrapper": {
            "display": "flex"
        }
    }));

export const { i18n } = declareComponentKeys<
    | "used"
    | "max"
    | {
          K: "quota card title";
          P: { what: string; isLimit: boolean };
      }
>()({ CircularUsage });
