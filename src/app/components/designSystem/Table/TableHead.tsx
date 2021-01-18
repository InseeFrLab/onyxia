import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTableHead from "@material-ui/core/TableHead";
import { TableHeadClassKey } from "@material-ui/core/TableHead";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type TableHeadProps = {
    className?: string | null,
    children: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<TableHeadProps> = {
    "className": null
};


const useStyles = makeStyles(
    theme => createStyles<Id<TableHeadClassKey, "root">, {}>({
        "root": {
            "borderBottom": `1px solid ${theme.custom.colors.palette.midnightBlue.light2}`
        }
    })
);

export function TableHead(props: TableHeadProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, className } = completedProps;

    const classes = useStyles();

    return (
        <MuiTableHead className={className ?? undefined} classes={classes} >
            {children}
        </MuiTableHead>
    );

}
