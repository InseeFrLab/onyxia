import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableCell from "@material-ui/core/TableCell";
import { TableCellClassKey } from "@material-ui/core/TableCell";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableCellProps = {
    children: NonNullable<React.ReactNode>;
    align?: "center" | "inherit" | "justify" | "left" | "right";
};

const defaultProps: Optional<TableCellProps> = {
    "align": "inherit"
};


const useStyles = makeStyles(
    () => createStyles<Id<TableCellClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableCell(props: TableCellProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableCell classes={classes} >
            {children}
        </MuiTableCell>
    );

}
