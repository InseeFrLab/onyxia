import type { TypographyOptions } from "@material-ui/core/styles/createTypography";

export const typography = {

    //NOTE: Font imported in public/index.html
    "fontFamily": '"Work Sans", sans-serif',

    "h1": {
        "fontWeight": "bold",
        "fontSize": "60px",
        "lineHeight": 1.2
    },

    "h2": {
        "fontWeight": "bold",
        "fontSize": "36px",
        "lineHeight": 1.11
    },

    "h3": {
        "fontWeight": 500,
        "fontSize": "28px",
        "lineHeight": 1.29
    },

    "h4": {
        "fontWeight": "bold",
        "fontSize": "24px",
        "lineHeight": 1.33
    },

    "h5": {
        "fontWeight": 600,
        "fontSize": "20px",
        "lineHeight": 1.2
    },

    "h6": {
        "fontWeight": 500,
        "fontSize": "20px",
        "lineHeight": 1.2
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
        "fontWeight": 600,
        "fontSize": "20px",
        "lineHeight": 1.2
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
