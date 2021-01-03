import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableFooter from "@material-ui/core/TableFooter";
import { TableFooterClassKey } from "@material-ui/core/TableFooter";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableFooterProps = {
    children: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<TableFooterProps> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<TableFooterClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableFooter(props: TableFooterProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableFooter classes={classes} >
            {children}
        </MuiTableFooter>
    );

}
