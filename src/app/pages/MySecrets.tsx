import React from "react";

import { IconsPreview } from "app/atoms/icons/IconsPreview";
import { useIsDarkModeEnabled } from "app/redux/hooks";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { useTheme } from '@material-ui/core/styles';

export function MySecrets() {

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

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

            <IconsPreview />
        </>
    );

};