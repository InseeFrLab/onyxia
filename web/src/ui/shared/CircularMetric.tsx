import type { ReactNode } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";

type Props = {
    className?: string;
    children: ReactNode;
    percentage: number;
    severity: "success" | "info" | "warning" | "error";
    isInverted?: boolean;
};

export function CircularMetric(props: Props) {
    const { className, children, percentage, severity, isInverted = false } = props;

    const { classes, cx } = useStyles({ severity, isInverted });

    const circularProgressSize = 60;

    return (
        <div className={cx(classes.root, className)}>
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
                    value={percentage}
                />
                <div className={classes.percentageWrapper}>
                    <Text typo="body 1">{children}</Text>
                </div>
            </div>
        </div>
    );
}

const useStyles = tss
    .withName({ CircularMetric })
    .withParams<{
        severity: "success" | "info" | "warning" | "error";
        isInverted: boolean;
    }>()
    .create(({ theme, severity, isInverted }) => ({
        root: {
            display: "flex",
            justifyContent: "center",
            ...theme.spacing.topBottom("margin", 2)
        },
        circularProgressInnerWrapper: {
            position: "relative"
        },
        circularProgress: {
            verticalAlign: "top",
            color: isInverted
                ? theme.colors.useCases.surfaces.background
                : theme.colors.useCases.alertSeverity[severity].main,
            position: "relative"
        },
        backLayerCircularProgress: {
            verticalAlign: "top",
            color: theme.colors.useCases.alertSeverity[severity][
                isInverted ? "main" : "background"
            ]
        },
        percentageWrapper: {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        },
        backLayerCircularProgressWrapper: {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }
    }));
