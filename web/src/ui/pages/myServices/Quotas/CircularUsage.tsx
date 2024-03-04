import CircularProgress from "@mui/material/CircularProgress";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { capitalize } from "tsafe/capitalize";

type Props = {
    className?: string;
    name: string;
    used: string;
    total: string;
    usagePercentage: number;
    severity: "success" | "info" | "warning" | "error";
};

export function CircularUsage(props: Props) {
    const { className, name, used, total, usagePercentage, severity } = props;

    /*
    if( Date.now() > 0 ){
        usagePercentage = 80;
    }
    */

    const { cx, classes } = useStyles({
        severity
    });

    const circularProgressSize = 60;

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="label 1">{capitalize(name)}</Text>
            <div className={classes.circularProgressWrapper}>
                <div className={classes.circularProgressInnerWrapper}>
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
                    <div className={classes.backLayerCircularProgressWrapper}>
                        <CircularProgress
                            size={circularProgressSize}
                            className={classes.backLayerCircularProgress}
                            variant="determinate"
                            value={100}
                        />
                    </div>
                </div>
            </div>
            <div className={classes.metricsWrapper}>
                <Text typo="label 1">Used:</Text>&nbsp;<Text typo="body 1">{used}</Text>
                <div style={{ "flex": 1 }} />
                <Text typo="label 1">Max:</Text>&nbsp;<Text typo="body 1">{total}</Text>
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
            "color": theme.colors.useCases.alertSeverity[severity].main
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
            //...theme.spacing.rightLeft("padding", 2)
        }
    }));
