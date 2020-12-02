import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { AppIcon } from "./AppIcon";
import type { Props as AppIconProps } from "./AppIcon";
import { id } from "evt/tools/typeSafety/id";

const appIconTypes = id<AppIconProps["type"][]>(
    [
        "tour", "services", "secrets", "profile",
        "lab", "info", "home", "trainings", "files",
        "collaborationTools", "bash"
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

export function AppIconOverview() {

    const classes = useStyles();

    return (
        <>
            {appIconTypes.map(appIconType => (
                <>
                    <h3><code>{`<AppIcon type="${appIconType}"/>`}</code></h3>
                    <div className={classes.root} key={appIconType}>
                        {(["inherit", "disabled", "primary", "secondary", "action", "error"] as const).map(color =>
                            <AppIcon type={appIconType} color={color} key={color} />
                        )}
                    </div>
                </>
            ))}
        </>
        
    );
}