import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableHead from "@material-ui/core/TableHead";
import { TableHeadClassKey } from "@material-ui/core/TableHead";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableHeadProps = {
    children: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<TableHeadProps> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<TableHeadClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableHead(props: TableHeadProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableHead classes={classes} >
            {children}
        </MuiTableHead>
    );

}
