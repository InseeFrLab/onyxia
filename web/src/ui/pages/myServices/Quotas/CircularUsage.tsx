import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { tss } from "tss";

type Props = {
    className?: string;
    name: string;
    used: string;
    total: string;
    usagePercentage: number;
};

export function CircularUsage(props: Props) {
    const { className, name, used, total, usagePercentage } = props;

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            {name} {used} / {total}
            <CircularProgress variant="determinate" value={usagePercentage} />
            <div className={classes.typographyWrapper}>
                <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                >{`${usagePercentage}%`}</Typography>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ CircularUsage }).create(() => ({
    "root": {
        //"position": "relative",
        //"display": "inline-flex",
    },
    "typographyWrapper": {
        /*
            "top": 0,
            "left": 0,
            "bottom": 0,
            "right": 0,
            "position": "absolute",
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
            */
    }
}));
