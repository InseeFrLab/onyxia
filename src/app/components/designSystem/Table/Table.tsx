
import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTable from "@material-ui/core/Table";
import { TableClassKey } from "@material-ui/core/Table";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableProps = {
    children: NonNullable<React.ReactNode>;
    className?: string | null;
    'aria-label': string;
};

const defaultProps: Optional<TableProps> = {
    "className": null
};


const useStyles = makeStyles(
    () => createStyles<Id<TableClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function Table(props: TableProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, className } = completedProps;

    const classes = useStyles();

    return (
        <MuiTable
            classes={classes}
            className={className ?? undefined}
            aria-label={completedProps["aria-label"]}
        >
            {children}
        </MuiTable>
    );

}
