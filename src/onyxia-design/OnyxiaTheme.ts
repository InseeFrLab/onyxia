
import type { Theme } from "@material-ui/core";

export type OnyxiaTheme = Theme["custom"] & {
    spacing: Theme["spacing"];
    paletteType: Theme["palette"]["type"];
    muiTheme: Omit<Theme, "custom">;
};

export function themeToOnyxiaTheme(theme: Theme): OnyxiaTheme {

    const { custom, ...muiTheme } = theme;

    return {
        ...custom,
        "paletteType": muiTheme.palette.type,
        "spacing": muiTheme.spacing,
        muiTheme
    };

}



