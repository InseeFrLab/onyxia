


import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiLink from "@material-ui/core/Link";
import { LinkClassKey } from "@material-ui/core/Link";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    /** Usually a plain text, that represents the text of the link */
    children: React.ReactNode;
    href: string;
};

export const defaultProps: Optional<Props> = {
};


const useStyles = makeStyles(
    () => createStyles<Id<LinkClassKey, "root">, {}>({
        "root": {
        }
    })
);


// NOTE for later integration with type route
// https://material-ui.com/guides/composition/#link
// https://github.com/typehero/type-route#step-4-navigate-between-routes

export function Link(props: Props) {

    const { children, href } = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles();

    return <MuiLink classes={classes} href={href}>{children}</MuiLink>

}






