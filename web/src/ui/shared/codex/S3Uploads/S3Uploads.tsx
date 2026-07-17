import bytes from "bytes";
import { useState } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import type { S3Uri } from "core/tools/S3Uri";
import { stringifyS3Uri } from "core/tools/S3Uri";
import type { Link } from "type-route";
import { ConfirmAbortUploadDialog } from "./ConfirmAbortUploadDialog";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { getS3ObjectIconUrl } from "ui/shared/codex/getS3ObjectIconUrl";

export type S3UploadsProps = {
    className?: string;
    uploads: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        size: number;
        completionPercent: number;
        uploadStartTime: number;
        erroredErrorMessage: string | undefined;
    }[];

    onFlushUploads: () => void;

    // NOTE: We assert it refers to an upload that is still running.
    onCancelUpload: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => void;

    // NOTE: We assert that it points to an errored upload.
    onRetryUpload: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => void;

    getDirectoryLink: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => Link;
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

// bytes() can emit labels as wide as "1023.99KB"; reserve room to avoid text shifts.
const MAX_FORMATTED_UPLOAD_SIZE_WIDTH_CH = 9;
const MAX_UPLOAD_PERCENT_WIDTH_CH = 4;

export function S3Uploads(props: S3UploadsProps) {
    const {
        className,
        uploads,
        onFlushUploads,
        onCancelUpload,
        onRetryUpload,
        getDirectoryLink
    } = props;
    const { classes, cx } = useStyles();
    const { t } = useTranslation({ S3Uploads });
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const [isConfirmAbortUploadDialogOpen, setIsConfirmAbortUploadDialogOpen] =
        useState(false);
    const handleToggleCollapsed = () => {
        setInternalCollapsed(previous => !previous);
    };

    const runningUploads = uploads.filter(
        upload =>
            upload.erroredErrorMessage === undefined && upload.completionPercent < 100
    );
    const uploadingCount = runningUploads.length;
    const uploadCount = uploads.length;

    const handleClose = () => {
        if (runningUploads.length === 0) {
            onFlushUploads();
            return;
        }

        setIsConfirmAbortUploadDialogOpen(true);
    };

    const handleConfirmAbortUpload = () => {
        setIsConfirmAbortUploadDialogOpen(false);
        onFlushUploads();
    };

    if (uploadCount === 0) {
        return null;
    }

    const headerTitle =
        uploadingCount > 0
            ? t("uploading count", { count: uploadingCount })
            : t("upload count", { count: uploadCount });

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.header}>
                <div className={classes.headerTitle}>{headerTitle}</div>
                <div className={classes.headerActions}>
                    <button
                        type="button"
                        className={classes.headerIconButton}
                        onClick={handleToggleCollapsed}
                        aria-label={
                            internalCollapsed
                                ? t("expand uploads")
                                : t("collapse uploads")
                        }
                    >
                        <Icon
                            icon={getIconUrlByName(
                                internalCollapsed ? "ExpandMore" : "ExpandLess"
                            )}
                            size="small"
                        />
                    </button>
                    <button
                        type="button"
                        className={classes.headerIconButton}
                        onClick={handleClose}
                        aria-label={t("close uploads")}
                    >
                        <Icon icon={getIconUrlByName("Clear")} size="small" />
                    </button>
                </div>
            </div>
            <div className={classes.divider} />
            {!internalCollapsed && (
                <div className={classes.list}>
                    {uploads.map(upload => {
                        const fileBasename = getFileName(upload.s3Uri);
                        const percent = Math.max(
                            0,
                            Math.min(100, upload.completionPercent)
                        );
                        const roundedPercent = Math.round(percent);
                        const isError = upload.erroredErrorMessage !== undefined;
                        const isCompleted = !isError && percent === 100;
                        const isUploading = !isError && !isCompleted;
                        const uploadedSize = Math.round((upload.size * percent) / 100);
                        const totalSizeLabel = getFormattedSize(upload.size);
                        const uploadedSizeLabel = getFormattedSize(uploadedSize);
                        const statusLabel = (() => {
                            if (isUploading) {
                                return t("uploading status");
                            }

                            if (isCompleted) {
                                return t("completed");
                            }

                            return t("error");
                        })();
                        const sizeLabel = isUploading
                            ? t("uploaded size of total size", {
                                  uploadedSize: uploadedSizeLabel,
                                  totalSize: totalSizeLabel
                              })
                            : totalSizeLabel;
                        const messageSuffix =
                            upload.erroredErrorMessage !== undefined &&
                            upload.erroredErrorMessage !== ""
                                ? ` - ${upload.erroredErrorMessage}`
                                : "";
                        const metaPrefix = sizeLabel;
                        const metaStatus = isUploading
                            ? `${statusLabel} ${roundedPercent}%`
                            : `${statusLabel}${messageSuffix}`;
                        const metaLabel = `${metaPrefix} - ${metaStatus}`;
                        const uploadKey = [
                            upload.profileName,
                            stringifyS3Uri(upload.s3Uri),
                            upload.uploadStartTime
                        ].join(":");

                        return (
                            <div key={uploadKey} className={classes.item}>
                                <div className={classes.itemContent}>
                                    <div
                                        className={cx(
                                            classes.iconWrapper,
                                            !isCompleted && classes.iconMuted
                                        )}
                                    >
                                        <Icon
                                            icon={getS3ObjectIconUrl(fileBasename)}
                                            size="small"
                                        />
                                    </div>
                                    <div className={classes.itemText}>
                                        <div
                                            className={classes.fileName}
                                            title={fileBasename}
                                        >
                                            {fileBasename}
                                        </div>
                                        <div className={classes.meta} title={metaLabel}>
                                            {isUploading ? (
                                                <span
                                                    className={cx(
                                                        classes.metaPrefix,
                                                        classes.metaPrefixUploading
                                                    )}
                                                >
                                                    <span
                                                        className={
                                                            classes.metaUploadedSize
                                                        }
                                                    >
                                                        {uploadedSizeLabel}
                                                    </span>
                                                    <span
                                                        className={
                                                            classes.metaSizeConnector
                                                        }
                                                    >
                                                        {t("of")}
                                                    </span>
                                                    <span>{totalSizeLabel}</span>
                                                </span>
                                            ) : (
                                                <span className={classes.metaPrefix}>
                                                    {metaPrefix}
                                                </span>
                                            )}
                                            <span className={classes.metaSeparator}>
                                                -
                                            </span>
                                            <span
                                                className={cx(
                                                    classes.metaStatus,
                                                    isCompleted &&
                                                        classes.metaStatusSuccess,
                                                    isError && classes.metaStatusError
                                                )}
                                            >
                                                {isCompleted && (
                                                    <span
                                                        className={classes.metaStatusIcon}
                                                    >
                                                        <Icon
                                                            icon={getIconUrlByName(
                                                                "CheckCircleOutline"
                                                            )}
                                                            size="extra small"
                                                        />
                                                    </span>
                                                )}
                                                {isError && (
                                                    <span
                                                        className={classes.metaStatusIcon}
                                                    >
                                                        <Icon
                                                            icon={getIconUrlByName(
                                                                "ErrorOutline"
                                                            )}
                                                            size="extra small"
                                                        />
                                                    </span>
                                                )}
                                                <span className={classes.metaStatusLabel}>
                                                    {isUploading
                                                        ? statusLabel
                                                        : metaStatus}
                                                </span>
                                                {isUploading && (
                                                    <span
                                                        className={
                                                            classes.metaStatusPercent
                                                        }
                                                    >
                                                        {`${roundedPercent}%`}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isCompleted ? (
                                    <a
                                        className={classes.itemAction}
                                        {...getDirectoryLink({
                                            profileName: upload.profileName,
                                            s3Uri: upload.s3Uri
                                        })}
                                        aria-label={t("open uploaded directory")}
                                    >
                                        <Icon
                                            icon={getIconUrlByName("Folder")}
                                            size="small"
                                        />
                                    </a>
                                ) : isUploading ? (
                                    <button
                                        type="button"
                                        className={classes.itemAction}
                                        onClick={() =>
                                            onCancelUpload({
                                                profileName: upload.profileName,
                                                s3Uri: upload.s3Uri
                                            })
                                        }
                                        aria-label={t("cancel upload")}
                                    >
                                        <Icon
                                            icon={getIconUrlByName("Cancel")}
                                            size="small"
                                        />
                                    </button>
                                ) : isError ? (
                                    <button
                                        type="button"
                                        className={classes.itemAction}
                                        onClick={() =>
                                            onRetryUpload({
                                                profileName: upload.profileName,
                                                s3Uri: upload.s3Uri
                                            })
                                        }
                                        aria-label={t("retry upload")}
                                    >
                                        <Icon
                                            icon={getIconUrlByName("Replay")}
                                            size="small"
                                        />
                                    </button>
                                ) : null}
                                {isUploading && (
                                    <div
                                        className={classes.itemProgress}
                                        aria-hidden="true"
                                    >
                                        <div
                                            className={classes.itemProgressFill}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <ConfirmAbortUploadDialog
                isOpen={isConfirmAbortUploadDialogOpen}
                onClose={() => setIsConfirmAbortUploadDialogOpen(false)}
                onConfirm={handleConfirmAbortUpload}
            />
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
        paddingRight: theme.spacing(2.5),
        paddingLeft: theme.spacing(2.5),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    },
    headerTitle: {
        ...theme.typography.variants["label 1"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        justifyContent: "flex-end"
    },
    headerIconButton: {
        border: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        padding: 0,
        borderRadius: 9999,
        cursor: "pointer",
        color: theme.colors.useCases.typography.textSecondary,
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
    divider: {
        height: 1,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    list: {
        display: "flex",
        flexDirection: "column",
        overflow: "auto"
    },
    item: {
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: theme.spacing(2.5),
        "&:not(:last-of-type)": {
            boxShadow: `inset 0 -1px 0 ${theme.colors.useCases.surfaces.surface2}`
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
        flexShrink: 0,
        alignSelf: "center"
    },
    iconMuted: {
        opacity: 0.3
    },
    itemText: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        justifyContent: "center",
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
        textOverflow: "ellipsis",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        minWidth: 0,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"'
    },
    metaPrefix: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    metaPrefixUploading: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(0.5)
    },
    metaUploadedSize: {
        display: "inline-block",
        width: `${MAX_FORMATTED_UPLOAD_SIZE_WIDTH_CH}ch`,
        textAlign: "right",
        flexShrink: 0
    },
    metaSizeConnector: {
        flexShrink: 0
    },
    metaSeparator: {
        flexShrink: 0
    },
    metaStatus: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
    },
    metaStatusLabel: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    metaStatusPercent: {
        display: "inline-block",
        width: `${MAX_UPLOAD_PERCENT_WIDTH_CH}ch`,
        textAlign: "right",
        flexShrink: 0
    },
    metaStatusIcon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    metaStatusSuccess: {
        color: theme.colors.useCases.alertSeverity.success.main
    },
    metaStatusError: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    itemProgress: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        overflow: "hidden",
        backgroundColor: theme.colors.useCases.surfaces.surface3,
        pointerEvents: "none"
    },
    itemProgressFill: {
        height: "100%",
        backgroundColor: theme.colors.useCases.typography.textFocus,
        transition: "width 180ms ease, background-color 120ms ease"
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
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        alignSelf: "center",
        flexShrink: 0,
        transition: "background-color 120ms ease, color 120ms ease",
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        }
    }
}));

const { i18n } = declareComponentKeys<
    | { K: "uploading count"; P: { count: number }; R: string }
    | { K: "upload count"; P: { count: number }; R: string }
    | "expand uploads"
    | "collapse uploads"
    | "close uploads"
    | "uploading status"
    | "completed"
    | "error"
    | {
          K: "uploaded size of total size";
          P: { uploadedSize: string; totalSize: string };
          R: string;
      }
    | "of"
    | "open uploaded directory"
    | "cancel upload"
    | "retry upload"
>()({ S3Uploads });
export type I18n = typeof i18n;
