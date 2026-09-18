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
                <div className={classes.header}>
                    <div className={classes.titleRow}>
                        <Text typo="section heading" className={classes.title}>
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
                    <div className={classes.dividerWrapper}>
                        <div className={classes.divider} />
                    </div>
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
        height: "100%",
        minHeight: 0,
        zIndex: theme.muiTheme.zIndex.modal,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        overflow: "hidden",
        padding: `64px ${theme.spacing(4)}px ${theme.spacing(6)}px 0`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.7),
        backdropFilter: "blur(1px)",
        "@media (max-width: 720px)": {
            padding: 0
        }
    },
    panel: {
        width: 657,
        height: 976,
        maxWidth: "100%",
        maxHeight: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        overflow: "hidden",
        boxSizing: "border-box",
        padding: `${theme.spacing(4)}px ${theme.spacing(5)}px`,
        borderRadius: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: "0 6px 10px 0 rgba(44, 50, 63, 0.07)",
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
            height: "100%",
            borderRadius: 0,
            padding: `${theme.spacing(4)}px ${theme.spacing(3)}px`
        }
    },
    header: {
        flex: "none",
        display: "flex",
        flexDirection: "column"
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
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
    dividerWrapper: {
        padding: `${theme.spacing(3)}px 0`
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.useCases.typography.textSecondary
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden"
    }
}));
