

import React from "react";
import type { Optional } from "evt/tools/typeSafety";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import type { DialogTitleClassKey } from "@material-ui/core/DialogTitle";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { noUndefined } from "app/utils/noUndefined";
import type { Id } from "evt/tools/typeSafety";
import Typography from "@material-ui/core/Typography";

// https://material-ui.com/components/dialogs/#form-dialogs

export type Props = {
    id: string;
    children: React.ReactNode;
    subtitle: React.ReactNode;
};

export const defaultProps: Optional<Props> = {
};

const useDialogTitleStyles = makeStyles(
    () => createStyles<Id<DialogTitleClassKey, "root">, Required<Props>>({
        "root": {
        }
    })
);


const useStyles = makeStyles(
    () => createStyles<"subtitle", Required<Props>>({
        "subtitle": {
        }
    })
);


export function DialogTitle(props: Props) {

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
            {subtitle === null ?
                null :
                <Typography className={classes.subtitle} variant="subtitle1">{subtitle}</Typography>
            }
        </MuiDialogTitle>
    );

}

export function generateIdForLabelledby(): string {
    return `${Math.random()}`;
}


