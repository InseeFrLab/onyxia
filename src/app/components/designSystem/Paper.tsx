
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiPaper from "@material-ui/core/Link";
import { PaperClassKey } from "@material-ui/core/Paper";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    /** Usually a plain text, that represents the text of the link */
    children: NonNullable<React.ReactNode>;
};

export const defaultProps: Optional<Props> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<PaperClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function Paper(props: Props) {

    const { children } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiPaper classes={classes}>{children}</MuiPaper>

}
