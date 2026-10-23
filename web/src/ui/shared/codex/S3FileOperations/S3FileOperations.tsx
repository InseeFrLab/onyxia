import { useState } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { getIconUrlByName } from "lazy-icons";
import bytes from "bytes";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type S3FileOperationsProps = {
    className?: string;
    operations: {
        id: string;
        profileName?: string;
        operation: "copy" | "move" | "rename";
        name: string;
        isDirectory?: boolean;
        destination: string;
        phase: "listing" | "copying" | "deleting" | "completed" | "errored" | "canceled";
        percent: number | undefined;
        completedCount: number;
        totalCount: number | undefined;
        copiedSize: number;
        totalSize: number | undefined;
        errors: string[];
    }[];
    onCancel: (id: string) => void;
    onDismissCompleted: () => void;
};

export function S3FileOperations(props: S3FileOperationsProps) {
    const { className, operations, onCancel, onDismissCompleted } = props;
    const { classes, cx } = useStyles();
    const { t } = useTranslation({ S3FileOperations });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
    if (operations.length === 0) return null;
    const running = operations.filter(operation =>
        ["listing", "copying", "deleting"].includes(operation.phase)
    );
    return (
        <section
            className={cx(classes.root, className)}
            aria-label={t("file operations")}
        >
            <header className={classes.header}>
                <span>{t("file operations")}</span>
                <IconButton
                    icon={getIconUrlByName(isCollapsed ? "ExpandMore" : "ExpandLess")}
                    aria-label={t(isCollapsed ? "expand" : "collapse")}
                    onClick={() => setIsCollapsed(value => !value)}
                />
                <IconButton
                    icon={getIconUrlByName("Close")}
                    aria-label={t("close")}
                    onClick={() => {
                        if (running.length === 0) onDismissCompleted();
                        else setIsConfirmCancelOpen(true);
                    }}
                />
            </header>
            {!isCollapsed && (
                <div className={classes.list}>
                    {operations.map(operation => {
                        const isRunning = ["listing", "copying", "deleting"].includes(
                            operation.phase
                        );
                        return (
                            <article key={operation.id} className={classes.operation}>
                                <div className={classes.row}>
                                    <span className={classes.icon}>
                                        <Icon
                                            icon={getIconUrlByName(
                                                operation.isDirectory
                                                    ? "Folder"
                                                    : "Description"
                                            )}
                                        />
                                    </span>
                                    <div className={classes.details}>
                                        <strong
                                            className={classes.name}
                                            title={operation.name}
                                        >
                                            {t(operation.operation)} {operation.name}
                                        </strong>
                                        <span
                                            className={classes.destination}
                                            title={operation.destination}
                                        >
                                            {operation.profileName !== undefined &&
                                                `${operation.profileName} · `}
                                            {operation.destination}
                                        </span>
                                        <span className={classes.status} role="status">
                                            {t(operation.phase)}
                                            {operation.percent !== undefined && isRunning
                                                ? ` · ${operation.percent}%`
                                                : ""}
                                        </span>
                                        {operation.totalCount !== undefined && (
                                            <span className={classes.status}>
                                                {t("object count", {
                                                    completed: operation.completedCount,
                                                    total: operation.totalCount
                                                })}
                                                {operation.totalSize !== undefined
                                                    ? ` · ${bytes(operation.copiedSize)} / ${bytes(operation.totalSize)}`
                                                    : ""}
                                            </span>
                                        )}
                                    </div>
                                    {isRunning && (
                                        <IconButton
                                            icon={getIconUrlByName("CancelOutlined")}
                                            aria-label={t("cancel operation", {
                                                name: operation.name
                                            })}
                                            onClick={() => onCancel(operation.id)}
                                        />
                                    )}
                                </div>
                                {isRunning && (
                                    <LinearProgress
                                        aria-label={t("progress")}
                                        variant={
                                            operation.percent === undefined
                                                ? "indeterminate"
                                                : "determinate"
                                        }
                                        value={operation.percent}
                                    />
                                )}
                                {operation.errors.length !== 0 && (
                                    <details className={classes.error}>
                                        <summary>
                                            {t("errors", {
                                                count: operation.errors.length
                                            })}
                                        </summary>
                                        {operation.errors.map((error, i) => (
                                            <p key={i}>{error}</p>
                                        ))}
                                    </details>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
            <Dialog
                isOpen={isConfirmCancelOpen}
                onClose={() => setIsConfirmCancelOpen(false)}
                title={t("cancel all title")}
                body={t("cancel all body")}
                buttons={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setIsConfirmCancelOpen(false)}
                        >
                            {t("continue")}
                        </Button>
                        <Button
                            onClick={() => {
                                running.forEach(operation => onCancel(operation.id));
                                onDismissCompleted();
                                setIsConfirmCancelOpen(false);
                            }}
                        >
                            {t("cancel all")}
                        </Button>
                    </>
                }
            />
        </section>
    );
}
const useStyles = tss.withName({ S3FileOperations }).create(({ theme }) => ({
    root: {
        background: theme.colors.useCases.surfaces.surface1,
        color: theme.colors.useCases.typography.textPrimary,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,.12)",
        overflow: "hidden",
        width: 420,
        maxWidth: "calc(100vw - 32px)"
    },
    header: {
        display: "flex",
        gap: theme.spacing(1),
        alignItems: "center",
        padding: theme.spacing(1.5),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
        "& > span": { flex: 1, fontWeight: 500 }
    },
    list: { maxHeight: "min(60vh, 500px)", overflowY: "auto" },
    operation: {
        padding: theme.spacing(1.5),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    row: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        marginBottom: theme.spacing(1)
    },
    icon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: 8,
        background: theme.colors.useCases.surfaces.surface2
    },
    details: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        flex: 1,
        gap: theme.spacing(0.5)
    },
    name: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    destination: {
        fontSize: 12,
        color: theme.colors.useCases.typography.textSecondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    status: { fontSize: 12 },
    error: {
        color: theme.colors.useCases.alertSeverity.error.main,
        fontSize: 12,
        overflowWrap: "anywhere",
        "& summary": { cursor: "pointer" }
    }
}));
const { i18n } = declareComponentKeys<
    | "file operations"
    | "expand"
    | "collapse"
    | "close"
    | "copy"
    | "move"
    | "rename"
    | "listing"
    | "copying"
    | "deleting"
    | "completed"
    | "errored"
    | "canceled"
    | "progress"
    | "cancel all title"
    | "cancel all body"
    | "continue"
    | "cancel all"
    | { K: "object count"; P: { completed: number; total: number }; R: string }
    | { K: "cancel operation"; P: { name: string }; R: string }
    | { K: "errors"; P: { count: number }; R: string }
>()({ S3FileOperations });
export type I18n = typeof i18n;
