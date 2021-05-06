
import type { PaletteOptions } from "@material-ui/core/styles/createPalette";
import Color from "color";

const palette = {
    "exuberantOrange": {
        "main": "#FF562C",
        "light": "#FFAD99",
        "light2": "#FFF2E5"
    },
    "midnightBlue": {
        "main": "#2C323F",
        "light": "#373E4F",
        "light2": "#525966",
        "light3": "#C9C9C9"
    },
    "whiteSnow": {
        "main": "#F1F0EB",
        "white": "#FDFDFC",
        "greyVariant1": "#E6E6E6",
        "greyVariant2": "#9E9E9E",
        "greyVariant3": "#747474"
    },
    "limeGreen": {
        "main": "#BAFF29",
        "light": "#E2FFA6"
    },
    "misc": {
        "redError": {
            "main": "#CC0B0B",
            "light": "#FEECEB"
        },
        "greenSuccess": {
            "main": "#29CC2F",
            "light": "#EEFAEE"
        },
        "orangeWarning": {
            "main": "#FF8800",
            "light": "#FFF5E5"
        },
        "blueInfo": {
            "main": "#2196F3",
            "light": "#E9F5FE"
        }
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
            "actionDisabledBackground": palette.whiteSnow.greyVariant1
        },
        "surfaces": {
            "background": palette.whiteSnow.main,
            "surfaces": palette.whiteSnow.white
        },
        "alertSeverity": {
            "error": {
                "main": palette.misc.redError.main,
                "background": palette.misc.redError.light
            },
            "success": {
                "main": palette.misc.greenSuccess.main,
                "background": palette.misc.greenSuccess.light
            },
            "warning": {
                "main": palette.misc.orangeWarning.main,
                "background": palette.misc.orangeWarning.light
            },
            "info": {
                "main": palette.misc.blueInfo.main,
                "background": palette.misc.blueInfo.light
            }
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
        },
        "alertSeverity": {
            "error": {
                "main": palette.misc.redError.main,
                "background": setOpacity(palette.misc.redError.main, 0.2)
            },
            "success": {
                "main": palette.misc.greenSuccess.main,
                "background": setOpacity(palette.misc.greenSuccess.main, 0.2)
            },
            "warning": {
                "main": palette.misc.orangeWarning.main,
                "background": setOpacity(palette.misc.orangeWarning.main, 0.2)
            },
            "info": {
                "main": palette.misc.blueInfo.main,
                "background": setOpacity(palette.misc.blueInfo.main, 0.2)
            }
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
            "main": useCases.typography.textPrimary,
            "light": useCases.typography.textSecondary
        },
        "error": {
            "light": useCases.alertSeverity.error.background,
            "main": useCases.alertSeverity.error.main,
            "contrastText": useCases.typography.textPrimary
        },
        "success": {
            "light": useCases.alertSeverity.success.background,
            "main": useCases.alertSeverity.success.main,
            "contrastText": useCases.typography.textPrimary
        },
        "info": {
            "light": useCases.alertSeverity.info.background,
            "main": useCases.alertSeverity.info.main,
            "contrastText": useCases.typography.textPrimary
        },
        "warning": {
            "light": useCases.alertSeverity.warning.background,
            "main": useCases.alertSeverity.warning.main,
            "contrastText": useCases.typography.textPrimary
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
            "disabledBackground": useCases.buttons.actionDisabledBackground,
            "focus": useCases.typography.textFocus
        }
    };

};



function setOpacity(color: string, opacity: number): string {
    return new Color(color)
        .rgb()
        .alpha(opacity)
        .string();
}

