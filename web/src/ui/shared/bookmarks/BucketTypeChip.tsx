import Chip from "@mui/material/Chip";
import { tss } from "tss";
import type { BucketType } from "./types";

export type BucketTypeChipProps = {
    type: BucketType;
    showIcon?: boolean;
    colorVariant?: BucketType;
};

const tagLabels: Record<BucketType, string> = {
    personal: "Personal",
    group: "Group project",
    "read-write": "Read and write",
    "read-only": "Read-only"
};

const tagIcons: Record<BucketType, string> = {
    personal: "person",
    group: "groups",
    "read-write": "edit",
    "read-only": "visibility"
};

export function BucketTypeChip(props: BucketTypeChipProps) {
    const { type, showIcon = true, colorVariant } = props;
    const { classes } = useStyles({ type: colorVariant ?? type, showIcon });

    return (
        <Chip
            size="small"
            className={classes.tag}
            classes={{ label: classes.label, icon: classes.iconWrapper }}
            icon={
                showIcon ? (
                    <span
                        className={`material-symbols-outlined ${classes.icon}`}
                        aria-hidden="true"
                    >
                        {tagIcons[type]}
                    </span>
                ) : undefined
            }
            label={tagLabels[type]}
        />
    );
}

const useStyles = tss
    .withName({ BucketTypeChip })
    .withParams<{ type: BucketType; showIcon: boolean }>()
    .create(({ theme, type, showIcon }) => {
        const backgroundByType: Record<BucketType, string> = {
            personal: "#BCF9AA",
            group: "#A6E5FD",
            "read-write": "#EAEAEA",
            "read-only": "#EAEAEA"
        };
        const backgroundColor = backgroundByType[type];
        const contentColor = theme.isDarkModeEnabled
            ? "#2C323F"
            : theme.colors.useCases.typography.textPrimary;
        const body2 = theme.typography.variants["body 2"].style;

        return {
            tag: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: showIcon ? "0 6px 0 6px" : "0 6px 0 10px",
                borderRadius: 999,
                backgroundColor,
                color: contentColor,
                "& .MuiChip-icon": {
                    color: contentColor,
                    marginLeft: 0,
                    marginRight: 4
                },
                "& .MuiChip-iconSmall": {
                    color: contentColor,
                    marginLeft: 0,
                    marginRight: 4
                },
                "& .MuiChip-label": {
                    color: contentColor
                }
            },
            iconWrapper: {
                marginLeft: 0,
                marginRight: 4,
                color: contentColor
            },
            label: {
                fontSize: body2.fontSize,
                fontWeight: body2.fontWeight,
                fontFamily: body2.fontFamily,
                lineHeight: body2.lineHeight,
                letterSpacing: body2.letterSpacing ?? "0.02em",
                textTransform: "none",
                paddingLeft: 0,
                paddingRight: 6
            },
            icon: {
                fontSize: 14,
                lineHeight: "14px",
                color: "inherit",
                textTransform: "none",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            }
        };
    });
