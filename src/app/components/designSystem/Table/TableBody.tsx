
import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableBody from "@material-ui/core/TableBody";
import { TableBodyClassKey } from "@material-ui/core/TableBody";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableBodyProps = {
    children: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<TableBodyProps> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<TableBodyClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableBody(props: TableBodyProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableBody classes={classes} >
            {children}
        </MuiTableBody>
    );

}
