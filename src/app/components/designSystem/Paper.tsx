
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiPaper from "@material-ui/core/Paper";
import { PaperClassKey } from "@material-ui/core/Paper";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    /** Usually a plain text, that represents the text of the link */
    children: NonNullable<React.ReactNode>;
    elevation?: number;
};

const defaultProps: Optional<Props> = {
    "elevation": 1
};

const useStyles = makeStyles(
    () => createStyles<Id<PaperClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function Paper(props: Props) {

    const { children, elevation } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiPaper elevation={elevation} classes={classes}>{children}</MuiPaper>

}
