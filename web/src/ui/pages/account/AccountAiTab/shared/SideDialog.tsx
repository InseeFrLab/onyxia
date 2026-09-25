import { useId, type ReactNode } from "react";
import Drawer from "@mui/material/Drawer";
import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { breakpointsValues } from "onyxia-ui";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

/**
 * A panel floating on the right of the screen. The focus trap, the scroll lock,
 * closing with Escape or by clicking outside are handled by MUI's Drawer.
 */
export function SideDialog(props: {
    title: ReactNode;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const { children, title, closeLabel, onClose } = props;
    const { classes } = useStyles();
    const titleId = useId();

    return (
        <Drawer
            open={true}
            anchor="right"
            onClose={onClose}
            PaperProps={{
                className: classes.panel,
                "aria-labelledby": titleId
            }}
            slotProps={{ backdrop: { className: classes.backdrop } }}
        >
            <div className={classes.header}>
                <Text
                    typo="section heading"
                    className={classes.title}
                    componentProps={{ id: titleId }}
                >
                    {title}
                </Text>
                <IconButton
                    className={classes.closeButton}
                    size="default"
                    icon={getIconUrlByName("Close")}
                    aria-label={closeLabel}
                    onClick={onClose}
                />
            </div>

            <div className={classes.childrenWrapper}>{children}</div>
        </Drawer>
    );
}

const useStyles = tss.withName({ SideDialog }).create(({ theme }) => ({
    backdrop: {
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.7),
        backdropFilter: "blur(1px)"
    },
    // NOTE: Positioned by its insets, its size follows from the viewport it floats in
    panel: {
        top: theme.spacing(4),
        right: theme.spacing(4),
        bottom: theme.spacing(4),
        height: "auto",
        // The width of the mockup, as long as the screen is wide enough
        width: 657,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        boxSizing: "border-box",
        padding: `${theme.spacing(4)}px ${theme.spacing(5)}px`,
        borderRadius: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        backgroundImage: "none",
        boxShadow: theme.shadows[1],
        [`@media (max-width: ${breakpointsValues.sm}px)`]: {
            inset: 0,
            borderRadius: 0,
            padding: `${theme.spacing(4)}px ${theme.spacing(3)}px`
        }
    },
    header: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2)
    },
    title: {
        flex: 1,
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    closeButton: {
        flex: "none",
        padding: 0
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden"
    }
}));
