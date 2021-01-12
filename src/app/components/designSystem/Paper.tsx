
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
    theme => createStyles<Id<PaperClassKey, "root">, Required<Props>>({
        "root": ({ elevation }) => ({
            "boxShadow": theme.custom.shadows[elevation]
        })
    })
);

export function Paper(props: Props) {
    
    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, className, style } = completedProps;

    const classes = useStyles(completedProps);

    return (
    <MuiPaper 
        style={style ?? undefined} 
        className={className ?? undefined} 
        classes={classes}>
            {children}
        
    </MuiPaper>
    );

}
