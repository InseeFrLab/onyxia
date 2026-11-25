import type { Theme } from "ui/theme";

/** The styles the parts of the field have in common, picked by each of them */
export function getSharedStyles(params: { theme: Theme }) {
    const { theme } = params;

    return {
        ellipsis: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1
        },
        field: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1),
            flex: 1,
            minWidth: 0
        },
        filledInput: {
            ...theme.typography.variants["body 1"].style,
            height: 45,
            boxSizing: "border-box",
            padding: theme.spacing({ topBottom: 2, rightLeft: 2.5 }),
            borderRadius: 8,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            "& input::placeholder": {
                color: theme.colors.useCases.typography.textSecondary,
                opacity: 1
            },
            "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                minWidth: 0
            },
            "& .MuiSelect-icon": {
                color: theme.colors.useCases.typography.textPrimary
            }
        },
        providerLabel: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            minWidth: 0,
            width: "100%"
        },
        providerLogo: {
            width: 24,
            height: 24,
            flexShrink: 0,
            objectFit: "contain",
            borderRadius: "50%"
        },
        section: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2)
        }
    } as const;
}
