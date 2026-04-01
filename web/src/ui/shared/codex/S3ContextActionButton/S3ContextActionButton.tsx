import { memo } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "onyxia-ui/Tooltip";
import { tss } from "tss";

export type S3ContextActionButtonProps = {
    className?: string;
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
};

export const S3ContextActionButton = memo((props: S3ContextActionButtonProps) => {
    const { className, icon, label, onClick, disabled = false } = props;

    const { classes, cx } = useStyles();

    return (
        <Tooltip title={label}>
            <span className={classes.tooltipAnchor}>
                <button
                    type="button"
                    aria-label={label}
                    className={cx(classes.button, className)}
                    onClick={onClick}
                    disabled={disabled}
                >
                    <span className={classes.icon}>{icon}</span>
                </button>
            </span>
        </Tooltip>
    );
});

const useStyles = tss.withName({ S3ContextActionButton }).create(({ theme }) => ({
    tooltipAnchor: {
        display: "inline-flex",
        flexShrink: 0
    },
    button: {
        padding: theme.spacing(3),
        margin: 0,
        border: "none",
        borderRadius: "12px",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        color: theme.colors.useCases.typography.textPrimary,
        cursor: "pointer",
        transition: "background-color 120ms ease, color 120ms ease, opacity 120ms ease",
        "&:hover": {
            color: theme.colors.useCases.typography.textFocus
        },
        "&:active": {
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textFocus
        },
        "&:focus-visible": {
            outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
            outlineOffset: "2px"
        },
        "&:disabled": {
            cursor: "default",
            opacity: 0.5
        },
        "&:disabled:hover, &:disabled:active": {
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textPrimary
        }
    },
    icon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        "& .MuiSvgIcon-root, & svg, & img": {
            width: "20px",
            height: "20px",
            fontSize: "20px"
        }
    }
}));
