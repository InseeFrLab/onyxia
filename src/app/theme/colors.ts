
import type { PaletteOptions } from "@material-ui/core/styles/createPalette";

const palette = {
    "exuberantOrange": {
        "main": "#FF562C",
        "light": "#FFAD99",
        "light2": "#FFF2E5"
    },
    "midnightBlue": {
        "main": "#2C323F",
        "light": "#525966",
        "light2": "#C9C9C9"
    },
    "whiteSnow": {
        "main": "#F1F0EB",
        "white": "#FDFDFC",
        "greyVariant1": "#E6E6E6",
        "greyVariant2": "#9E9E9E",
        "greyVariant3": "#747474"
    },
    "error": {
        "main": "#CC0B0B",
        "light": "#F88078",
        "background": "#FEECEB"
    },
    "success": {
        "main": "#29CC2F",
        "light": "#7FCC82",
        "background": "#EEFAEE"
    }
};

export function getColors(paletteType: "light" | "dark") {

    const useCasesLight = {
        "typography": {
            "textPrimary": palette.midnightBlue.main,
            "textSecondary": palette.midnightBlue.light,
            "textDisabled": palette.whiteSnow.greyVariant2,
            "textFocus": palette.exuberantOrange.main
        },
        "buttons": {
            "actionHoverPrimary": palette.exuberantOrange.main,
            "actionHoverSecondary": palette.midnightBlue.main,
            "actionHoverTernary": palette.whiteSnow.main,
            "actionSelected": palette.whiteSnow.greyVariant1,
            "actionActive": palette.exuberantOrange.main,
            "actionDisabled": palette.whiteSnow.greyVariant2,
            "actionDisabledBackground": palette.midnightBlue.light2
        },
        "surfaces": {
            "background": palette.whiteSnow.main,
            "surfaces": palette.whiteSnow.white
        }
    };

    const useCasesDark: typeof useCasesLight = {
        "typography": {
            ...useCasesLight.typography,
            "textPrimary": palette.whiteSnow.white,
            "textSecondary": palette.whiteSnow.main,
            "textDisabled": palette.whiteSnow.greyVariant2
        },
        "buttons": {
            ...useCasesLight.buttons,
            "actionHoverSecondary": palette.whiteSnow.white,
            "actionSelected": palette.midnightBlue.light
        },
        "surfaces": {
            "background": palette.midnightBlue.main,
            "surfaces": palette.midnightBlue.light
        }
    };

    return {
        palette,
        "useCases": (() => {
            switch (paletteType) {
                case "light": return useCasesLight;
                case "dark": return useCasesDark
            }
        })()
    };

};


export function getMuiPaletteOption(paletteType: "light" | "dark"): PaletteOptions {

    const { useCases } = getColors(paletteType);

    return {
        "type": paletteType,
        "primary": {
            "main": palette.exuberantOrange.main,
            "light": palette.exuberantOrange.light
        },
        "secondary": {
            "main": palette.midnightBlue.main,
            "light": palette.midnightBlue.light,
        },
        "error": {
            "light": palette.error.light,
            "main": palette.error.main,
        },
        "success": {
            "light": palette.success.light,
            "main": palette.success.main,
        },
        "grey": {
            "50": "#fafafa",
            "100": "#f5f5f5",
            "200": "#eeeeee",
            "300": "#e0e0e0",
            "400": "#bdbdbd",
            "500": "#9e9e9e",
            "600": "#757575",
            "700": "#616161",
            "800": "#424242",
            "900": "#212121",
            "A100": "#d5d5d5",
            "A200": "#aaaaaa",
            "A400": "#303030",
            "A700": "#616161"
        },
        "text": {
            "primary": useCases.typography.textPrimary,
            "secondary": useCases.typography.textSecondary,
            "disabled": useCases.typography.textDisabled,
            "hint": useCases.typography.textFocus
        },
        "divider": useCases.buttons.actionDisabledBackground,
        "background": {
            "paper": useCases.surfaces.surfaces,
            "default": useCases.surfaces.background
        },
        "action": {
            "active": useCases.buttons.actionActive,
            "hover": useCases.buttons.actionHoverPrimary,
            "selected": useCases.buttons.actionSelected,
            "disabled": useCases.buttons.actionDisabled,
            "disabledBackground": useCases.buttons.actionDisabledBackground
            /*
            "focus": "rgba(0, 0, 0, 0.12)",

            //TODO: See how those values are filled.
            "selectedOpacity": 0.08,
            "hoverOpacity": 0.04,
            "disabledOpacity": 0.38,
            "focusOpacity": 0.12,
            "activatedOpacity": 0.12
            */
        }
    };

};




