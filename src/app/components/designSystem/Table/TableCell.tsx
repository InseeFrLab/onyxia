import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableCell from "@material-ui/core/TableCell";
import { TableCellClassKey } from "@material-ui/core/TableCell";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableCellProps = {
    children: React.ReactNode;
    align?: "center" | "inherit" | "justify" | "left" | "right";
    size?: "medium" | "small";
};

const defaultProps: Optional<TableCellProps> = {
    "align": "inherit",
    "size": "medium"
};


const useStyles = makeStyles(
    () => createStyles<Id<TableCellClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableCell(props: TableCellProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, align, size } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableCell classes={classes} {...{ align, size }} >
            {children}
        </MuiTableCell>
    );

}
