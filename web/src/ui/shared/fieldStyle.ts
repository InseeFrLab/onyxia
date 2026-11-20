import type { Theme } from "ui/theme";

/**
 * The look shared by every field of the AI providers tab (Figma's "CodeFrame").
 * No height is set: it follows from the padding and the line height of the content.
 */
export function getFieldStyle(params: { theme: Theme }) {
    const { theme } = params;

    return {
        frame: {
            boxSizing: "border-box",
            borderRadius: theme.spacing(2),
            border: "2px solid transparent",
            backgroundColor: theme.colors.useCases.surfaces.background,
            color: theme.colors.useCases.typography.textPrimary,
            transition: "background-color 160ms ease, border-color 160ms ease"
        },
        padding: {
            paddingTop: theme.spacing(2),
            paddingBottom: theme.spacing(2),
            paddingLeft: theme.spacing(2.5),
            paddingRight: theme.spacing(2.5)
        },
        frame_hover: {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        frame_focused: {
            borderColor: theme.colors.useCases.buttons.actionActive
        },
        frame_error: {
            borderColor: theme.colors.useCases.alertSeverity.error.main
        },
        frame_readOnly: {
            // NOTE: Not surface2: in dark mode it is darker than the card, the border would not show
            borderColor: theme.colors.useCases.surfaces.surface3,
            backgroundColor: "transparent"
        },
        /**
         * For a button or a chip inside a field: it overlaps the padding of the field
         * instead of making it taller, so that every field has the height of a line.
         */
        embeddedControl: {
            marginTop: -theme.spacing(2),
            marginBottom: -theme.spacing(2)
        },
        placeholder: {
            ...theme.typography.variants["body 1"].style,
            color: theme.colors.useCases.typography.textSecondary,
            opacity: 1
        },
        /** The dropdown of a select or an autocomplete */
        menuPaper: {
            marginTop: theme.spacing(1),
            borderRadius: theme.spacing(2.5),
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            backgroundImage: "none",
            boxShadow: theme.shadows[2]
        },
        /**
         * The states of an option of a dropdown, after Figma's ListSelector:
         * hovered (surface-hover), selected (surface-focus-primary),
         * selected and hovered (surface-selected-primary).
         * NOTE: "&&": above MUI's own rules, which the app injects after these.
         */
        option: {
            "&&:hover, &&.Mui-focusVisible, &&.Mui-focused": {
                // NOTE: Figma's surface-hover, which onyxia-ui has no use case for.
                backgroundColor: theme.isDarkModeEnabled
                    ? theme.colors.palette.dark.greyVariant2
                    : theme.colors.palette.dark.greyVariant5
            },
            '&&.Mui-selected, &&[aria-selected="true"]': {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
            },
            // NOTE: Not on .Mui-focusVisible: a menu opens with its selected item focused.
            '&&.Mui-selected:hover, &&[aria-selected="true"]:hover, &&[aria-selected="true"].Mui-focused':
                {
                    backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2
                }
        },
        /** A pill, whatever its height */
        pill: {
            borderRadius: 9999
        }
    } as const;
}
