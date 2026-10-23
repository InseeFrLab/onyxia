import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import bucketIcon from "ui/assets/svg/S3UriBucket.svg";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogItemSummary,
    S3DialogTextInput,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";
import {
    directoryBreadcrumbs,
    isForbiddenDestination,
    normalizeDirectory
} from "./paths";

export type S3FileOperationDestinationDialogProps = {
    className?: string;
    isOpen: boolean;
    operation: "copy" | "move";
    itemCount: number;
    initialDestination: string;
    delimiter: string;
    sources: { uri: string; isDirectory: boolean }[];
    loadDirectories: (directory: string) => Promise<{ name: string; uri: string }[]>;
    onConfirm: (directory: string) => void;
    onClose: () => void;
};

export function S3FileOperationDestinationDialog(
    props: S3FileOperationDestinationDialogProps
) {
    const {
        className,
        isOpen,
        operation,
        itemCount,
        initialDestination,
        delimiter,
        sources,
        loadDirectories,
        onConfirm,
        onClose
    } = props;
    const { classes, cx } = useStyles();
    const dialogClasses = useS3DialogClasses();
    const { t } = useTranslation({ S3FileOperationDestinationDialog });
    const [directory, setDirectory] = useState(initialDestination);
    const [pathInput, setPathInput] = useState(initialDestination);
    const [isEditingPath, setIsEditingPath] = useState(false);
    const [newFolderName, setNewFolderName] = useState<string>();
    const [virtualFolders, setVirtualFolders] = useState<
        Record<string, { name: string; uri: string }[]>
    >({});
    const [reload, setReload] = useState(0);
    const [listing, setListing] = useState<{
        directory: string;
        directories: { name: string; uri: string }[];
        isLoading: boolean;
        error: string | undefined;
    }>({ directory, directories: [], isLoading: true, error: undefined });

    useEffect(() => {
        if (!isOpen) return;
        setDirectory(initialDestination);
        setPathInput(initialDestination);
        setIsEditingPath(false);
        setNewFolderName(undefined);
        setVirtualFolders({});
    }, [isOpen, initialDestination]);

    useEffect(() => {
        if (!isOpen) return;
        let isCurrent = true;
        setListing({ directory, directories: [], isLoading: true, error: undefined });
        loadDirectories(directory).then(
            directories => {
                if (isCurrent)
                    setListing({
                        directory,
                        directories,
                        isLoading: false,
                        error: undefined
                    });
            },
            error => {
                if (isCurrent)
                    setListing({
                        directory,
                        directories: [],
                        isLoading: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
            }
        );
        return () => {
            isCurrent = false;
        };
    }, [isOpen, directory, loadDirectories, reload]);

    const breadcrumbs = directoryBreadcrumbs(directory, delimiter);
    const isLoading = listing.directory !== directory || listing.isLoading;
    const folders = [
        ...(listing.directory === directory ? listing.directories : []),
        ...(virtualFolders[directory] ?? [])
    ]
        .filter(
            (folder, i, all) => all.findIndex(other => other.uri === folder.uri) === i
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    const pathCandidate = normalizeDirectory(pathInput, delimiter);
    const isForbidden = isForbiddenDestination({ directory, delimiter, sources });
    const folderError =
        newFolderName === undefined ||
        (newFolderName.trim() !== "" &&
            !newFolderName.includes(delimiter) &&
            !newFolderName.includes("/") &&
            !folders.some(folder => folder.name === newFolderName.trim()))
            ? undefined
            : t("invalid folder name");
    const navigate = (uri: string) => {
        setDirectory(uri);
        setPathInput(uri);
        setIsEditingPath(false);
        setNewFolderName(undefined);
    };
    const createFolder = () => {
        if (newFolderName === undefined || folderError !== undefined) return;
        const name = newFolderName.trim();
        const uri = directory + name + delimiter;
        setVirtualFolders(previous => ({
            ...previous,
            [directory]: [...(previous[directory] ?? []), { name, uri }]
        }));
        navigate(uri);
    };

    return (
        <Dialog
            className={cx(dialogClasses.paper, classes.root, className)}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            classes={{
                title: cx(dialogClasses.title, classes.title),
                body: dialogClasses.body,
                buttons: classes.buttons
            }}
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={true}
            title={t(operation === "copy" ? "copy title" : "move title", {
                count: itemCount
            })}
            body={
                <div className={classes.body}>
                    <div className={classes.path}>
                        {isEditingPath ? (
                            <div className={classes.editPath}>
                                <S3DialogTextInput
                                    label={t("destination path")}
                                    value={pathInput}
                                    onChange={setPathInput}
                                    autoFocus
                                    error={
                                        pathCandidate === undefined
                                            ? t("invalid path")
                                            : undefined
                                    }
                                    onEnterKeyDown={() => {
                                        if (pathCandidate !== undefined)
                                            navigate(pathCandidate);
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    disabled={pathCandidate === undefined}
                                    onClick={() => {
                                        if (pathCandidate !== undefined)
                                            navigate(pathCandidate);
                                    }}
                                >
                                    {t("go")}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <nav
                                    className={classes.breadcrumbs}
                                    aria-label={t("destination path")}
                                >
                                    {breadcrumbs.map((crumb, i) => (
                                        <span className={classes.crumb} key={crumb.uri}>
                                            {i !== 0 && (
                                                <span className={classes.separator}>
                                                    {delimiter}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => navigate(crumb.uri)}
                                                aria-current={
                                                    i === breadcrumbs.length - 1
                                                        ? "location"
                                                        : undefined
                                                }
                                                title={crumb.uri}
                                            >
                                                {i === 0 && (
                                                    <Icon
                                                        icon={bucketIcon}
                                                        size="extra small"
                                                    />
                                                )}
                                                {i === 1 && (
                                                    <Icon
                                                        icon={getIconUrlByName("Key")}
                                                        size="extra small"
                                                    />
                                                )}
                                                {crumb.label || delimiter}
                                            </button>
                                        </span>
                                    ))}
                                </nav>
                                <IconButton
                                    icon={getIconUrlByName("Edit")}
                                    aria-label={t("edit path")}
                                    onClick={() => setIsEditingPath(true)}
                                />
                            </>
                        )}
                    </div>
                    {isForbidden && (
                        <p role="alert" className={classes.error}>
                            {t("invalid destination")}
                        </p>
                    )}
                    <div className={classes.folders} aria-busy={isLoading}>
                        {isLoading ? (
                            <div className={classes.message} role="status">
                                <CircularProgress size={24} aria-label={t("loading")} />
                                {t("loading")}
                            </div>
                        ) : listing.error !== undefined ? (
                            <div className={classes.message} role="alert">
                                <span>{listing.error}</span>
                                <Button
                                    variant="secondary"
                                    onClick={() => setReload(value => value + 1)}
                                >
                                    {t("retry")}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {breadcrumbs.length > 1 && (
                                    <button
                                        type="button"
                                        className={classes.folder}
                                        onClick={() =>
                                            navigate(
                                                breadcrumbs[breadcrumbs.length - 2].uri
                                            )
                                        }
                                    >
                                        {t("parent folder")}
                                    </button>
                                )}
                                {folders.length === 0 && (
                                    <p className={classes.message}>
                                        {t("empty directory")}
                                    </p>
                                )}
                                {folders.map(folder => (
                                    <button
                                        type="button"
                                        className={classes.folder}
                                        key={folder.uri}
                                        onClick={() => navigate(folder.uri)}
                                    >
                                        <S3DialogItemSummary
                                            name={folder.name}
                                            icon="folder"
                                        />
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                    {newFolderName !== undefined && (
                        <div className={classes.newFolder}>
                            <S3DialogTextInput
                                label={t("folder name")}
                                value={newFolderName}
                                onChange={setNewFolderName}
                                autoFocus
                                error={folderError}
                                onEnterKeyDown={createFolder}
                            />
                            <Button
                                variant="secondary"
                                disabled={folderError !== undefined}
                                onClick={createFolder}
                            >
                                {t("create")}
                            </Button>
                            <Button
                                variant="ternary"
                                onClick={() => setNewFolderName(undefined)}
                            >
                                {t("cancel")}
                            </Button>
                        </div>
                    )}
                </div>
            }
            buttons={
                <>
                    <Button
                        className={classes.createButton}
                        variant="secondary"
                        startIcon={getIconUrlByName("CreateNewFolderOutlined")}
                        disabled={
                            isLoading || listing.error !== undefined || isEditingPath
                        }
                        onClick={() => setNewFolderName("")}
                    >
                        {t("create folder")}
                    </Button>
                    <Button variant="ternary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={
                            isLoading ||
                            listing.error !== undefined ||
                            isForbidden ||
                            isEditingPath ||
                            newFolderName !== undefined
                        }
                        onClick={() => onConfirm(directory)}
                    >
                        {t(operation === "copy" ? "copy items" : "move items")}
                    </Button>
                </>
            }
        />
    );
}

const useStyles = tss
    .withName({ S3FileOperationDestinationDialog })
    .create(({ theme }) => ({
        root: {
            width: 960,
            padding: 32,
            boxShadow: `0 4px 8px ${alpha(theme.colors.useCases.typography.textPrimary, 0.1)}`
        },
        title: { marginBottom: 24, fontSize: 24, lineHeight: "32px" },
        body: {
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0
        },
        path: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            padding: theme.spacing(1),
            borderRadius: 12,
            background: theme.colors.useCases.surfaces.surface2,
            minWidth: 0
        },
        breadcrumbs: { display: "flex", flex: 1, minWidth: 0, overflowX: "auto" },
        crumb: {
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            "& button": {
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                font: "inherit",
                fontWeight: 500,
                cursor: "pointer",
                border: 0,
                borderRadius: 8,
                padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
                color: theme.colors.useCases.typography.textPrimary,
                background: "transparent",
                "&:hover, &[aria-current]": {
                    background: theme.colors.useCases.surfaces.surface3
                }
            }
        },
        separator: {
            margin: `0 ${theme.spacing(1)}px`,
            color: theme.colors.useCases.typography.textSecondary
        },
        editPath: {
            width: "100%",
            display: "flex",
            gap: theme.spacing(2),
            alignItems: "center",
            "& > label": { flex: 1, minWidth: 0 }
        },
        folders: {
            boxSizing: "border-box",
            borderTop: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
            height: 314,
            overflowY: "auto",
            padding: "16px 0"
        },
        folder: {
            display: "flex",
            alignItems: "center",
            minHeight: 56,
            width: "100%",
            textAlign: "left",
            border: 0,
            font: "inherit",
            color: theme.colors.useCases.typography.textPrimary,
            background: "transparent",
            cursor: "pointer",
            padding: "8px 16px",
            borderRadius: 8,
            "&:hover, &:focus-visible": {
                background: theme.colors.useCases.surfaces.surface2
            }
        },
        message: {
            display: "flex",
            gap: theme.spacing(2),
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: theme.spacing(4),
            overflowWrap: "anywhere"
        },
        error: { color: theme.colors.useCases.alertSeverity.error.main, margin: 0 },
        newFolder: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            "& > label": { flex: 1, minWidth: 0 }
        },
        buttons: {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing(1),
            marginTop: 32
        },
        createButton: { marginRight: "auto" }
    }));

const { i18n } = declareComponentKeys<
    | { K: "copy title"; P: { count: number }; R: string }
    | { K: "move title"; P: { count: number }; R: string }
    | "destination path"
    | "edit path"
    | "go"
    | "invalid path"
    | "invalid destination"
    | "loading"
    | "retry"
    | "parent folder"
    | "empty directory"
    | "folder name"
    | "invalid folder name"
    | "create"
    | "create folder"
    | "cancel"
    | "copy items"
    | "move items"
>()({ S3FileOperationDestinationDialog });
export type I18n = typeof i18n;
