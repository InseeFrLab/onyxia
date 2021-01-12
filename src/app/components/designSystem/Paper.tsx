
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiPaper from "@material-ui/core/Paper";
import { PaperClassKey } from "@material-ui/core/Paper";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    children: NonNullable<React.ReactNode>;
    elevation?: number;
    className?: string | null;
    style?: React.CSSProperties | null;
};

const defaultProps: Optional<Props> = {
    "elevation": 1,
    "className": null,
    "style": null
};

const useStyles = makeStyles(
    () => createStyles<Id<PaperClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function Paper(props: Props) {

    const { children, elevation, className, style } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiPaper style={style ?? undefined} className={className ?? undefined} elevation={elevation} classes={classes}>{children}</MuiPaper>

}
