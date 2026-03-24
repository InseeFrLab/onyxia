import bytes from "bytes";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import type { S3Uri } from "core/tools/S3Uri";
import { stringifyS3Uri } from "core/tools/S3Uri";
import type { Link } from "type-route";

export type S3UploadsProps = {
    className?: string;
    uploads: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        directoryLink: Link;
        size: number;
        completionPercent: number;
    }[];
    onClearCompleted: () => void;
};

function getFormattedSize(size: number): string {
    return bytes(size) ?? `${size}B`;
}

function getFileName(s3Uri: S3Uri.NonTerminatedByDelimiter): string {
    const lastSegment = s3Uri.keySegments.at(-1);

    if (lastSegment !== undefined && lastSegment !== "") {
        return lastSegment;
    }

    return stringifyS3Uri(s3Uri);
}

export function S3Uploads(props: S3UploadsProps) {
    const { className, uploads, onClearCompleted } = props;
    const { classes, cx } = useStyles();

    const completedUploads = uploads.filter(upload => upload.completionPercent >= 100);
    const uploadingCount = uploads.filter(
        upload => upload.completionPercent < 100
    ).length;
    const uploadCount = uploads.length;

    const headerTitle =
        uploadCount === 0
            ? "No uploads"
            : uploadingCount > 0
              ? `Uploading ${uploadingCount} item${uploadingCount === 1 ? "" : "s"}...`
              : `${uploadCount} upload${uploadCount === 1 ? "" : "s"}`;

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.header}>
                <div className={classes.headerTitle}>{headerTitle}</div>
                <div className={classes.headerActions}>
                    <button
                        type="button"
                        className={classes.clearButton}
                        onClick={onClearCompleted}
                        disabled={completedUploads.length === 0}
                        aria-label="Clear completed uploads"
                    >
                        <Icon icon={getIconUrlByName("Clear")} size="small" />
                        <span className={classes.clearLabel}>Clear completed</span>
                    </button>
                </div>
            </div>
            <div className={classes.divider} />
            <div className={classes.list}>
                {uploads.map((upload, index) => {
                    const percent = Math.max(0, Math.min(100, upload.completionPercent));
                    const isCompleted = percent >= 100;
                    const uploadedSize = Math.round((upload.size * percent) / 100);
                    const totalSizeLabel = getFormattedSize(upload.size);
                    const uploadedSizeLabel = getFormattedSize(uploadedSize);
                    const metaLabel = isCompleted
                        ? `${upload.profileName} - ${totalSizeLabel} - Completed`
                        : `${upload.profileName} - ${uploadedSizeLabel} of ${totalSizeLabel} - Uploading... ${Math.round(percent)}%`;

                    return (
                        <div
                            key={`${stringifyS3Uri(upload.s3Uri)}-${index}`}
                            className={classes.item}
                        >
                            <div className={classes.itemContent}>
                                <div className={classes.iconWrapper}>
                                    <Icon
                                        icon={getIconUrlByName("Description")}
                                        size="small"
                                    />
                                </div>
                                <div className={classes.itemText}>
                                    <div
                                        className={classes.fileName}
                                        title={getFileName(upload.s3Uri)}
                                    >
                                        {getFileName(upload.s3Uri)}
                                    </div>
                                    <div
                                        className={cx(
                                            classes.meta,
                                            isCompleted && classes.metaCompleted
                                        )}
                                    >
                                        {metaLabel}
                                    </div>
                                    {!isCompleted && (
                                        <div className={classes.progressTrack}>
                                            <div
                                                className={classes.progressFill}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isCompleted && (
                                <a
                                    className={classes.itemAction}
                                    {...upload.directoryLink}
                                    aria-label="Open uploaded directory"
                                >
                                    <Icon
                                        icon={getIconUrlByName("OpenInNew")}
                                        size="small"
                                    />
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ S3Uploads }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        borderRadius: 20,
        boxShadow: theme.shadows[4],
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        overflow: "hidden"
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: theme.spacing(2)
    },
    headerTitle: {
        ...theme.typography.variants["label 1"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1)
    },
    clearButton: {
        border: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        padding: theme.spacing(1),
        borderRadius: 9999,
        cursor: "pointer",
        color: theme.colors.useCases.typography.textSecondary,
        ...theme.typography.variants["label 2"].style,
        transition: "background-color 120ms ease, color 120ms ease",
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        },
        "&:disabled": {
            cursor: "default",
            opacity: 0.5
        }
    },
    clearLabel: {
        whiteSpace: "nowrap"
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    list: {
        display: "flex",
        flexDirection: "column"
    },
    item: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: theme.spacing(2),
        "&:not(:last-of-type)": {
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
        }
    },
    itemContent: {
        display: "flex",
        alignItems: "flex-start",
        gap: theme.spacing(2),
        minWidth: 0,
        flex: 1
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary,
        flexShrink: 0
    },
    itemText: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        minWidth: 0,
        flex: 1
    },
    fileName: {
        ...theme.typography.variants["label 1"].style,
        color: theme.colors.useCases.typography.textPrimary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    meta: {
        ...theme.typography.variants["caption"].style,
        color: theme.colors.useCases.typography.textSecondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    metaCompleted: {
        color: theme.colors.useCases.alertSeverity.success.main
    },
    progressTrack: {
        height: 6,
        borderRadius: 999,
        backgroundColor: theme.colors.useCases.surfaces.surface3,
        overflow: "hidden",
        marginTop: theme.spacing(1)
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: theme.colors.useCases.typography.textFocus
    },
    itemAction: {
        width: 32,
        height: 32,
        borderRadius: 9999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.useCases.typography.textSecondary,
        textDecoration: "none",
        flexShrink: 0,
        transition: "background-color 120ms ease, color 120ms ease",
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        }
    }
}));
