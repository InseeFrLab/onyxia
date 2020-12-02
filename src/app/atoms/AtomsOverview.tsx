import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { AppIcon } from "./AppIcon";
import type { Props as AppIconProps } from "./AppIcon";
import { id } from "evt/tools/typeSafety/id";
import { useIsDarkModeEnabled } from "app/redux/hooks";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { useTheme } from "@material-ui/core/styles";

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

export function AtomsOverview() {

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();
    const classes = useStyles();
    const theme = useTheme();

    return (
        <>
            <FormControlLabel
                style={{ "margin": theme.spacing(2) }}
                control={
                    <Switch
                        checked={isDarkModeEnabled}
                        onChange={event => setIsDarkModeEnabled(event.target.checked)}
                        color="primary"
                    />
                }
                label={`Dark mode is currently ${isDarkModeEnabled ? "enabled" : "disabled"}`}
            />

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
        </>
    );
}