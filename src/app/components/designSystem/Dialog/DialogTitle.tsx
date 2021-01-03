

import React from "react";
import type { Optional } from "evt/tools/typeSafety";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import type { DialogTitleClassKey } from "@material-ui/core/DialogTitle";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { noUndefined } from "app/utils/noUndefined";
import type { Id } from "evt/tools/typeSafety";
import { Typography } from "../Typography";

// https://material-ui.com/components/dialogs/#form-dialogs

export type DialogTitleProps = {
    id: string;
    children: NonNullable<React.ReactNode>;
    subtitle: React.ReactNode;
};

const defaultProps: Optional<DialogTitleProps> = {
};

const useDialogTitleStyles = makeStyles(
    () => createStyles<Id<DialogTitleClassKey, "root">, Required<DialogTitleProps>>({
        "root": {
        }
    })
);


const useStyles = makeStyles(
    () => createStyles<"subtitle", Required<DialogTitleProps>>({
        "subtitle": {
        }
    })
);


export function DialogTitle(props: DialogTitleProps) {

    const completedProps = {
        ...defaultProps,
        ...noUndefined(props)
    };

    const { id, children, subtitle } = completedProps

    const dialogTitleClasses = useDialogTitleStyles(completedProps);

    const classes = useStyles(completedProps);

    return (
        <MuiDialogTitle
            id={id}
            disableTypography={true}
            classes={dialogTitleClasses}
        >
            <Typography variant="h2">{children}</Typography>
            {!subtitle ?
                null :
                <Typography className={classes.subtitle} variant="subtitle1">{subtitle}</Typography>
            }
        </MuiDialogTitle>
    );

}



