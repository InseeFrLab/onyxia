import { tss } from "ui/theme";

const useStyles = tss.withName("svgStyles").create(({ theme }) => ({
    "root": {
        [["&.", "& ."].map(prefix => `${prefix}focus-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.typography.textFocus
        },
        [["&.", "& ."].map(prefix => `${prefix}text-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.typography.textPrimary
        },
        [["&.", "& ."].map(prefix => `${prefix}surface-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.surfaces.surface1
        },
        [["&.", "& ."].map(prefix => `${prefix}background-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.surfaces.background
        }
    }
}));

export function useSvgStyles() {
    const { classes } = useStyles();

    const svgClassName = classes.root;

    return { svgClassName };
}
