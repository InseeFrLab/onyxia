import {
    useEffect,
    useMemo,
    useReducer,
    useRef,
    type ChangeEvent,
    type DragEvent
} from "react";
import { tss } from "tss";
import { alpha } from "@mui/material/styles";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import bytes from "bytes";
import { getS3ObjectIconUrl } from "ui/shared/codex/getS3ObjectIconUrl";
import { declareComponentKeys, useLang, useTranslation } from "ui/i18n";
import {
    getFilesToUploadFromDataTransfer,
    getFilesToUploadFromFiles,
    getHasDraggedFiles
} from "ui/shared/codex/getFilesToUploadFromDataTransfer";

export type S3FileRequestProps = {
    className?: string;
    expirationTime: number;
    uploads: readonly S3FileRequestProps.Upload[];
    onUploadFiles: (params: {
        files: readonly S3FileRequestProps.FileToUpload[];
    }) => void;
    onCancelUpload: (params: { uploadId: string }) => void;
    onRetryUpload: (params: { uploadId: string }) => void;
};

export namespace S3FileRequestProps {
    export type FileToUpload = {
        file: File;
        relativePathSegments: string[];
    };

    export type Upload = {
        uploadId: string;
        fileName: string;
        sizeInBytes: number;
        status: "uploading" | "success" | "failed";
        uploadPercent: number;
        errorMessage: string | undefined;
    };
}

export function S3FileRequest(props: S3FileRequestProps) {
    const {
        className,
        expirationTime,
        uploads,
        onUploadFiles,
        onCancelUpload,
        onRetryUpload
    } = props;
    const { classes, cx } = useStyles();
    const { t } = useTranslation({ S3FileRequest });
    const { lang } = useLang();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const [isDragActive, setIsDragActive] = useReducer(
        (_isDragActive: boolean, nextIsDragActive: boolean) => nextIsDragActive,
        false
    );
    const now = useNowUntil({ expirationTime });

    const isExpired = !Number.isFinite(expirationTime) || now >= expirationTime;

    const formattedExpirationTime = useMemo(() => {
        if (!Number.isFinite(expirationTime)) {
            return "";
        }

        return new Intl.DateTimeFormat(lang, {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(new Date(expirationTime));
    }, [expirationTime, lang]);

    useEffect(() => {
        if (!isExpired) {
            return;
        }

        dragDepthRef.current = 0;
        setIsDragActive(false);
    }, [isExpired]);

    const uploadFiles = (files: readonly S3FileRequestProps.FileToUpload[]) => {
        if (isExpired || files.length === 0) {
            return;
        }

        onUploadFiles({ files });
    };

    const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        uploadFiles(getFilesToUploadFromFiles(Array.from(event.target.files ?? [])));

        // Allow selecting the same file again after the upload has completed.
        event.target.value = "";
    };

    const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (isExpired || !getHasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDragActive(true);
    };

    const onDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (isExpired || !getHasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (!getHasDraggedFiles(event.dataTransfer)) {
            return;
        }

        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
            setIsDragActive(false);
        }
    };

    const onDrop = async (event: DragEvent<HTMLDivElement>) => {
        if (!getHasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        dragDepthRef.current = 0;
        setIsDragActive(false);

        const items = Array.from(event.dataTransfer.items);
        const files = Array.from(event.dataTransfer.files);

        uploadFiles(
            await getFilesToUploadFromDataTransfer({
                items,
                files
            })
        );
    };

    const hasUploads = uploads.length !== 0;
    const areAllUploadsSuccessful =
        hasUploads && uploads.every(upload => upload.status === "success");

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.content}>
                <section className={classes.card}>
                    <header className={classes.header}>
                        <div className={classes.heroIcon} aria-hidden="true">
                            <Icon icon={getIconUrlByName("CloudUpload")} size="large" />
                        </div>
                        <div className={classes.headerText}>
                            <Text
                                typo="display heading"
                                htmlComponent="h1"
                                className={classes.title}
                            >
                                {t("page title")}
                            </Text>
                            <Text typo="body 1" className={classes.description}>
                                {t("page description")}
                            </Text>
                        </div>
                    </header>

                    <div
                        className={cx(
                            classes.expiration,
                            isExpired && classes.expirationExpired
                        )}
                    >
                        <Icon
                            icon={getIconUrlByName(
                                isExpired ? "ErrorOutline" : "AccessTime"
                            )}
                            size="small"
                        />
                        <div>
                            <div className={classes.expirationTitle}>
                                {isExpired
                                    ? t("link expired")
                                    : t("expires on", {
                                          date: formattedExpirationTime
                                      })}
                            </div>
                            {isExpired && (
                                <div className={classes.expirationDescription}>
                                    {t("link expired description")}
                                </div>
                            )}
                        </div>
                    </div>

                    {!isExpired && (
                        <div
                            className={cx(
                                classes.dropZone,
                                isDragActive && classes.dropZoneActive
                            )}
                            onDragEnter={onDragEnter}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                hidden
                                onChange={onFileInputChange}
                            />
                            <div className={classes.dropZoneIcon} aria-hidden="true">
                                <Icon
                                    icon={getIconUrlByName(
                                        isDragActive ? "FileDownload" : "UploadFile"
                                    )}
                                    size="large"
                                />
                            </div>
                            <div className={classes.dropZoneTitle}>
                                {t(isDragActive ? "drop files active" : "drop files")}
                            </div>
                            <div className={classes.dropZoneHint}>
                                {t("drop files hint")}
                            </div>
                            <Button
                                startIcon={getIconUrlByName("Add")}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {t("choose files")}
                            </Button>
                        </div>
                    )}

                    {areAllUploadsSuccessful && (
                        <div className={classes.successNotice} role="status">
                            <Icon icon={getIconUrlByName("CheckCircle")} size="small" />
                            <div>
                                <div className={classes.successNoticeTitle}>
                                    {t("all files uploaded")}
                                </div>
                                <div className={classes.successNoticeDescription}>
                                    {t("all files uploaded description")}
                                </div>
                            </div>
                        </div>
                    )}

                    {hasUploads && (
                        <section className={classes.uploadsSection}>
                            <div className={classes.uploadsHeader}>
                                <div className={classes.uploadsTitle}>
                                    {t("uploads title")}
                                </div>
                                <div className={classes.uploadsCount}>
                                    {uploads.length}
                                </div>
                            </div>
                            <div className={classes.uploadsList}>
                                {uploads.map(upload => {
                                    const uploadPercent = Math.max(
                                        0,
                                        Math.min(100, upload.uploadPercent)
                                    );

                                    return (
                                        <div
                                            key={upload.uploadId}
                                            className={classes.uploadItem}
                                        >
                                            <div className={classes.fileIcon}>
                                                <Icon
                                                    icon={getS3ObjectIconUrl(
                                                        upload.fileName
                                                    )}
                                                    size="small"
                                                />
                                            </div>
                                            <div className={classes.uploadItemBody}>
                                                <div className={classes.fileNameRow}>
                                                    <div
                                                        className={classes.fileName}
                                                        title={upload.fileName}
                                                    >
                                                        {upload.fileName}
                                                    </div>
                                                    <div className={classes.fileSize}>
                                                        {formatSize(upload.sizeInBytes)}
                                                    </div>
                                                </div>
                                                <div className={classes.statusRow}>
                                                    <span
                                                        className={cx(
                                                            classes.status,
                                                            upload.status === "success" &&
                                                                classes.statusSuccess,
                                                            upload.status === "failed" &&
                                                                classes.statusError
                                                        )}
                                                    >
                                                        {upload.status === "uploading"
                                                            ? t("uploading", {
                                                                  percent:
                                                                      Math.round(
                                                                          uploadPercent
                                                                      )
                                                              })
                                                            : upload.status === "success"
                                                              ? t("uploaded")
                                                              : t("upload failed")}
                                                    </span>
                                                    {upload.errorMessage !==
                                                        undefined && (
                                                        <span
                                                            className={
                                                                classes.errorMessage
                                                            }
                                                            title={upload.errorMessage}
                                                        >
                                                            {upload.errorMessage}
                                                        </span>
                                                    )}
                                                </div>
                                                {upload.status === "uploading" && (
                                                    <div
                                                        className={classes.progressTrack}
                                                        role="progressbar"
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                        aria-valuenow={Math.round(
                                                            uploadPercent
                                                        )}
                                                    >
                                                        <div
                                                            className={
                                                                classes.progressFill
                                                            }
                                                            style={{
                                                                width: `${uploadPercent}%`
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {upload.status === "uploading" ? (
                                                <IconButton
                                                    className={classes.uploadAction}
                                                    icon={getIconUrlByName("Close")}
                                                    aria-label={t("cancel upload")}
                                                    onClick={() =>
                                                        onCancelUpload({
                                                            uploadId: upload.uploadId
                                                        })
                                                    }
                                                />
                                            ) : upload.status === "failed" ? (
                                                <IconButton
                                                    className={classes.uploadAction}
                                                    icon={getIconUrlByName("Replay")}
                                                    aria-label={t("retry upload")}
                                                    onClick={() =>
                                                        onRetryUpload({
                                                            uploadId: upload.uploadId
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    className={classes.uploadSuccessIcon}
                                                    aria-label={t("uploaded")}
                                                >
                                                    <Icon
                                                        icon={getIconUrlByName(
                                                            "CheckCircle"
                                                        )}
                                                        size="small"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <div className={classes.privacyNote}>
                        <Icon icon={getIconUrlByName("LockOutlined")} size="small" />
                        <span>{t("privacy note")}</span>
                    </div>
                </section>
            </div>
        </div>
    );
}

function useNowUntil(params: { expirationTime: number }): number {
    const { expirationTime } = params;
    const [now, refreshNow] = useReducer(() => Date.now(), Date.now());

    useEffect(() => {
        if (!Number.isFinite(expirationTime) || now >= expirationTime) {
            return;
        }

        const timeoutId = window.setTimeout(
            refreshNow,
            Math.min(30_000, expirationTime - now + 50)
        );

        return () => window.clearTimeout(timeoutId);
    }, [expirationTime, now]);

    return now;
}

function formatSize(sizeInBytes: number): string {
    return bytes(sizeInBytes) ?? `${sizeInBytes}B`;
}

const useStyles = tss.withName({ S3FileRequest }).create(({ theme }) => ({
    root: {
        height: "100%",
        overflow: "auto",
        boxSizing: "border-box",
        backgroundColor: theme.colors.useCases.surfaces.background,
        padding: `${theme.spacing(4)}px ${theme.spacing(3)}px ${theme.spacing(8)}px`
    },
    content: {
        width: "100%",
        maxWidth: 780,
        margin: "0 auto"
    },
    card: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        padding: theme.spacing(4),
        borderRadius: 24,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[3],
        "@media (max-width: 640px)": {
            padding: theme.spacing(2.5),
            borderRadius: 18
        }
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        gap: theme.spacing(2.5),
        "@media (max-width: 520px)": {
            flexDirection: "column"
        }
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 18,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.useCases.typography.textFocus,
        backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.1)
    },
    headerText: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    title: {
        margin: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    description: {
        color: theme.colors.useCases.typography.textSecondary,
        lineHeight: 1.6,
        maxWidth: 650
    },
    expiration: {
        display: "flex",
        alignItems: "flex-start",
        gap: theme.spacing(1.5),
        padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
        borderRadius: 12,
        color: theme.colors.useCases.typography.textSecondary,
        backgroundColor: theme.colors.useCases.surfaces.background,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    expirationExpired: {
        color: theme.colors.useCases.alertSeverity.error.main,
        borderColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.35),
        backgroundColor: theme.colors.useCases.alertSeverity.error.background
    },
    expirationTitle: {
        ...theme.typography.variants["label 1"].style
    },
    expirationDescription: {
        ...theme.typography.variants["body 2"].style,
        marginTop: theme.spacing(0.5)
    },
    dropZone: {
        minHeight: 260,
        boxSizing: "border-box",
        borderRadius: 18,
        border: `2px dashed ${alpha(theme.colors.useCases.typography.textFocus, 0.38)}`,
        backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.035),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: theme.spacing(1.25),
        padding: theme.spacing(4),
        transition:
            "border-color 160ms ease, background-color 160ms ease, transform 160ms ease"
    },
    dropZoneActive: {
        borderColor: theme.colors.useCases.typography.textFocus,
        backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.1),
        transform: "scale(1.006)"
    },
    dropZoneIcon: {
        width: 58,
        height: 58,
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(0.5),
        color: theme.colors.useCases.typography.textFocus,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[2]
    },
    dropZoneTitle: {
        ...theme.typography.variants["section heading"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    dropZoneHint: {
        ...theme.typography.variants["body 2"].style,
        color: theme.colors.useCases.typography.textSecondary,
        marginBottom: theme.spacing(1)
    },
    successNotice: {
        display: "flex",
        alignItems: "flex-start",
        gap: theme.spacing(1.5),
        padding: theme.spacing(2),
        borderRadius: 12,
        color: theme.colors.useCases.alertSeverity.success.main,
        border: `1px solid ${alpha(
            theme.colors.useCases.alertSeverity.success.main,
            0.35
        )}`,
        backgroundColor: theme.colors.useCases.alertSeverity.success.background
    },
    successNoticeTitle: {
        ...theme.typography.variants["label 1"].style
    },
    successNoticeDescription: {
        ...theme.typography.variants["body 2"].style,
        marginTop: theme.spacing(0.5)
    },
    uploadsSection: {
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    uploadsHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${theme.spacing(1.75)}px ${theme.spacing(2)}px`,
        backgroundColor: theme.colors.useCases.surfaces.background
    },
    uploadsTitle: {
        ...theme.typography.variants["label 1"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    uploadsCount: {
        ...theme.typography.variants["caption"].style,
        minWidth: 26,
        height: 26,
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.useCases.typography.textSecondary,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    uploadsList: {
        display: "flex",
        flexDirection: "column"
    },
    uploadItem: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        minWidth: 0,
        padding: theme.spacing(2),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        "&:not(:last-child)": {
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
        }
    },
    fileIcon: {
        width: 42,
        height: 42,
        borderRadius: 11,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.useCases.typography.textPrimary,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    uploadItemBody: {
        minWidth: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.75)
    },
    fileNameRow: {
        minWidth: 0,
        display: "flex",
        alignItems: "baseline",
        gap: theme.spacing(1.5)
    },
    fileName: {
        ...theme.typography.variants["label 1"].style,
        minWidth: 0,
        flex: 1,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        color: theme.colors.useCases.typography.textPrimary
    },
    fileSize: {
        ...theme.typography.variants["caption"].style,
        flexShrink: 0,
        color: theme.colors.useCases.typography.textSecondary
    },
    statusRow: {
        minWidth: 0,
        display: "flex",
        alignItems: "baseline",
        gap: theme.spacing(1)
    },
    status: {
        ...theme.typography.variants["caption"].style,
        flexShrink: 0,
        color: theme.colors.useCases.typography.textSecondary
    },
    statusSuccess: {
        color: theme.colors.useCases.alertSeverity.success.main
    },
    statusError: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    errorMessage: {
        ...theme.typography.variants["caption"].style,
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        color: theme.colors.useCases.typography.textSecondary
    },
    progressTrack: {
        width: "100%",
        height: 4,
        overflow: "hidden",
        borderRadius: 9999,
        backgroundColor: theme.colors.useCases.surfaces.surface3
    },
    progressFill: {
        height: "100%",
        borderRadius: 9999,
        backgroundColor: theme.colors.useCases.typography.textFocus,
        transition: "width 160ms ease"
    },
    uploadAction: {
        flexShrink: 0
    },
    uploadSuccessIcon: {
        width: 32,
        height: 32,
        borderRadius: 9999,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.useCases.alertSeverity.success.main
    },
    privacyNote: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing(1),
        textAlign: "center",
        color: theme.colors.useCases.typography.textSecondary,
        ...theme.typography.variants["caption"].style
    }
}));

const { i18n } = declareComponentKeys<
    | "page title"
    | "page description"
    | { K: "expires on"; P: { date: string }; R: string }
    | "link expired"
    | "link expired description"
    | "drop files"
    | "drop files active"
    | "drop files hint"
    | "choose files"
    | "all files uploaded"
    | "all files uploaded description"
    | "uploads title"
    | { K: "uploading"; P: { percent: number }; R: string }
    | "uploaded"
    | "upload failed"
    | "cancel upload"
    | "retry upload"
    | "privacy note"
>()({ S3FileRequest });
export type I18n = typeof i18n;
