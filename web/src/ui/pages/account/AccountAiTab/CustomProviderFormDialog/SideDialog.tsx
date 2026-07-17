import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { keyframes } from "tss-react";
import { tss } from "tss";

export function SideDialog(props: {
    title: ReactNode;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const { children, title, closeLabel, onClose } = props;
    const { classes } = useStyles();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const onRootClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={classes.root} onClick={onRootClick}>
            <div
                className={classes.panel}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === "string" ? title : undefined}
            >
                <div className={classes.headingWrapper}>
                    <Text typo="section heading" className={classes.title}>
                        {title}
                    </Text>
                    <IconButton
                        className={classes.closeButton}
                        size="small"
                        icon={getIconUrlByName("Close")}
                        aria-label={closeLabel}
                        onClick={onClose}
                    />
                </div>

                <div className={classes.childrenWrapper}>{children}</div>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ SideDialog }).create(({ theme }) => ({
    root: {
        position: "fixed",
        inset: 0,
        zIndex: theme.muiTheme.zIndex.modal,
        marginRight: theme.spacing(3),
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        padding: `64px ${theme.spacing(2)}px 32px`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
        backdropFilter: "blur(1px)",
        "@media (max-width: 720px)": {
            marginRight: 0,
            padding: 0
        }
    },
    panel: {
        width: 657,
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[4],
        animation: `${keyframes`
            from {
                opacity: 0;
                transform: translateX(28px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        `} 340ms cubic-bezier(0.2, 0, 0, 1)`,
        "@media (max-width: 720px)": {
            borderRadius: 0,
            borderTop: "none",
            borderBottom: "none"
        }
    },
    headingWrapper: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        margin: `0 ${theme.spacing(5)}px`,
        padding: `${theme.spacing(5)}px 0 ${theme.spacing(2)}px`,
        borderBottom: `1px solid ${theme.colors.useCases.typography.textSecondary}`
    },
    title: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    closeButton: {
        flex: "none"
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        padding: `${theme.spacing(5)}px ${theme.spacing(5)}px ${theme.spacing(4)}px`,
        boxSizing: "border-box"
    }
}));
