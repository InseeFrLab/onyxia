
import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableContainer from "@material-ui/core/TableContainer";
import { TableContainerClassKey } from "@material-ui/core/TableContainer";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableContainerProps = {
    children: NonNullable<React.ReactNode>;
    className?: string | null;
    component?: React.ElementType;
};

const defaultProps: Optional<TableContainerProps> = {
    "component": "div",
    "className": null
};


const useStyles = makeStyles(
    () => createStyles<Id<TableContainerClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function TableContainer(props: TableContainerProps) {

    const { children, component, className } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiTableContainer component={component} classes={classes} className={className ?? undefined}>
        {children}</MuiTableContainer>

}
