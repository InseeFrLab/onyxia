import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { ServiceBadge } from "./ServiceBadge";
import type { Props as ServiceBadgeProps } from "./ServiceBadge";
import { id } from "evt/tools/typeSafety/id";

const serviceBadgesType = id<ServiceBadgeProps["type"][]>(
    [
        "vscode", "rStudio"
    ]
);

const useStyles = makeStyles(theme =>
    createStyles({
        "root": {
            "& > svg": {
                "margin": theme.spacing(2)
            }
        }
    })
);

export function ServiceBadgeOverview() {

    const classes = useStyles();

    return (
        <>
            {serviceBadgesType.map(type => (
                <>
                    <h3><code>{`<ServiceBadge type="${type}"/>`}</code></h3>
                    <div className={classes.root} key={type}>
                        <ServiceBadge type={type}/>
                    </div>
                </>
            ))}
        </>
        
    );
}