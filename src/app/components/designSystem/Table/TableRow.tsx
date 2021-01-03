import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableRow from "@material-ui/core/TableRow";
import { TableRowClassKey } from "@material-ui/core/TableRow";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableRowProps = {
    children: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<TableRowProps> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<TableRowClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableRow(props: TableRowProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableRow classes={classes} >
            {children}
        </MuiTableRow>
    );

}
