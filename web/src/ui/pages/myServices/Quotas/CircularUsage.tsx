import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { CircularMetric } from "ui/shared/CircularMetric";

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

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="label 1">
                {t("quota card title", {
                    what: name.replace(/^limits\./, "").replace(/^requests\./, ""),
                    isLimit: name.startsWith("limits")
                })}
            </Text>
            <CircularMetric
                className={classes.circularMetric}
                percentage={usagePercentage}
                severity={severity}
            >
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
            </CircularMetric>
            <div className={classes.metricsWrapper}>
                <Text typo="label 1">{t("used")}:</Text>&nbsp;
                <Text typo="body 1">{used}</Text>
                <div style={{ flex: 1 }} />
                <Text typo="label 1">{t("max")}:</Text>&nbsp;
                <Text typo="body 1">{total}</Text>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ CircularUsage }).create(({ theme }) => ({
    root: {
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        borderRadius: theme.spacing(2),
        padding: theme.spacing(3),
        boxShadow: theme.shadows[1],
        "&:hover": {
            boxShadow: theme.shadows[6]
        }
    },
    circularMetric: {
        ...theme.spacing.topBottom("margin", 2)
    },
    metricsWrapper: {
        display: "flex"
    }
}));

const { i18n } = declareComponentKeys<
    | "used"
    | "max"
    | {
          K: "quota card title";
          P: { what: string; isLimit: boolean };
      }
>()({ CircularUsage });
export type I18n = typeof i18n;
