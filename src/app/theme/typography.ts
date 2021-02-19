import "./fonts.scss";
import type { TypographyOptions } from "@material-ui/core/styles/createTypography";

export const typography = {
    "fontFamily": '"Work Sans"',

    "h1": {
        "fontWeight": "bold",
        "fontSize": "60px",
        "lineHeight": 1.2
    },

    "h2": {
        "fontWeight": "bold",
        "fontSize": "48px",
        "lineHeight": 1.2
    },

    "h3": {
        "fontWeight": 500,
        "fontSize": "34px",
        "lineHeight": 1.2
    },

    "h4": {
        "fontWeight": "bold",
        "fontSize": "28px",
        "lineHeight": 1.15
    },

    "h5": {
        "fontWeight": 600,
        "fontSize": "22px",
        "lineHeight": 1.1
    },

    "h6": {
        "fontWeight": 500,
        "fontSize": "20px",
        "lineHeight": 1.1
    },

    "subtitle1": {
        "fontWeight": 500,
        "fontSize": "18px",
        "lineHeight": 1.1
    },

    "subtitle2": {
        "fontWeight": 500,
        "fontSize": "14px",
        "lineHeight": 1.2
    },

    "body1": {
        "fontWeight": "normal",
        "fontSize": "18px",
        "lineHeight": 1.1
    },

    "body2": {
        "fontWeight": "normal",
        "fontSize": "14px",
        "lineHeight": 1.1
    },

    "button": {
        "fontWeight": 500,
        "fontSize": "18px",
        "lineHeight": 1.10,
        "textTransform": "uppercase"
    },

    "caption": {
        "fontWeight": "normal",
        "fontSize": "14px",
        "lineHeight": 1
    }

} as const;

export const muiTypographyOptions: TypographyOptions = {
    ...typography, 
    /** 
     * bold is equivalent to 700 according to MDN
     * we do not use light weight font so we do not define
     * regular and default are not standard we define them
     * to match the name of the font as we import it.
     */
    "fontWeightRegular": 400,
    "fontWeightMedium": 500
};
