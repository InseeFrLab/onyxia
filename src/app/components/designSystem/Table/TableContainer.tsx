
import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableContainer from "@material-ui/core/TableContainer";
import { TableContainerClassKey } from "@material-ui/core/TableContainer";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableContainerProps = {
    children: NonNullable<React.ReactNode>;
    component: React.ElementType;
};

const defaultProps: Optional<TableContainerProps> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<TableContainerClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableContainer(props: TableContainerProps) {

    const { children, component } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiTableContainer component={component} classes={classes} >
        {children}</MuiTableContainer>

}
