import {
    Fragment,
    memo,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type MouseEvent,
    type MutableRefObject,
    type Ref
} from "react";
import { tss } from "tss";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { IconButton } from "onyxia-ui/IconButton";
import { Tooltip } from "onyxia-ui/Tooltip";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { useDomRect } from "powerhooks/useDomRect";
import { useClickAway } from "powerhooks/useClickAway";

export type ValidationErrorCode =
    | "INVALID_FORMAT"
    | "BUCKET_NOT_FOUND"
    | "ACCESS_DENIED"
    | "NOT_FOUND"
    | "UNKNOWN";

export type ValidationError = { code: ValidationErrorCode; message?: string };

export type ValidationResult =
    | { status: "success"; resolvedPath: string }
    | { status: "empty"; resolvedPath: string }
    | { status: "error"; error: ValidationError };

export type S3PathControlProps = {
    value: string;
    onNavigate: (nextPath: string) => void;
    validatePath: (draftPath: string) => Promise<ValidationResult>;
    onError?: (err: ValidationError) => void;
    onCopy?: (path: string) => void;
    onBookmark?: (path: string) => void;
    onCreatePrefix?: (path: string) => void;
    onImportData?: (path: string) => void;
    disabled?: boolean;
};

export type Mode = "read" | "edit" | "validating";

type Segment = {
    label: string;
    path: string;
    isCurrent: boolean;
};

export type Crumb = {
    label: string;
    path: string;
    kind: "root" | "bucket" | "prefix" | "object" | "unknown" | "ellipsis";
    isCurrent: boolean;
};

const errorMessages: Record<ValidationErrorCode, string> = {
    INVALID_FORMAT: "Invalid path format.",
    BUCKET_NOT_FOUND: "Bucket not found.",
    ACCESS_DENIED: "Access denied with current profile.",
    NOT_FOUND: "Path not found.",
    UNKNOWN: "Something went wrong."
};

const emptyMessage = "Path valid. No objects found.";
const copyMessage = "Path copied.";

function buildSegments(value: string): {
    segments: Segment[];
    scheme: string | null;
    hasTrailingSlash: boolean;
} {
    if (value === "s3://") {
        return { scheme: "s3://", segments: [], hasTrailingSlash: false };
    }

    const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(value);

    if (!match) {
        return {
            scheme: null,
            hasTrailingSlash: false,
            segments: value ? [{ label: value, path: value, isCurrent: true }] : []
        };
    }

    const bucket = match[1];
    const rest = match[2] ?? "";
    const trailingSlash = value.endsWith("/") && value !== "s3://";
    const parts = rest
        ? rest.split("/").filter((part, index, array) => {
              if (part !== "") {
                  return true;
              }

              return index < array.length - 1;
          })
        : [];

    const base = `s3://${bucket}`;

    const segments: Segment[] = [
        {
            label: bucket,
            path: base,
            isCurrent: parts.length === 0
        }
    ];

    parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const needsTrailingSlash = !isLast || trailingSlash;
        const path = `${base}/${parts.slice(0, index + 1).join("/")}${
            needsTrailingSlash ? "/" : ""
        }`;

        segments.push({
            label: part,
            path,
            isCurrent: isLast
        });
    });

    return { segments, scheme: "s3://", hasTrailingSlash: trailingSlash };
}

function getParentPath(value: string): string | null {
    if (value === "s3://") {
        return null;
    }

    const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(value);

    if (!match) {
        return null;
    }

    const bucket = match[1];
    const rest = match[2] ?? "";

    if (rest === "") {
        return "s3://";
    }

    const withoutTrailing = rest.endsWith("/") ? rest.slice(0, -1) : rest;
    const parts = withoutTrailing.split("/").filter(part => part !== "");

    if (parts.length <= 1) {
        return `s3://${bucket}`;
    }

    return `s3://${bucket}/${parts.slice(0, -1).join("/")}/`;
}

export type S3PathControlClasses = ReturnType<typeof useStyles>["classes"];
export type S3PathControlCx = ReturnType<typeof useStyles>["cx"];

export type S3PathBackButtonProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    canGoBack: boolean;
    onBack: () => void;
};

export const S3PathBackButton = memo((props: S3PathBackButtonProps) => {
    const { classes, cx, canGoBack, onBack } = props;

    return (
        <Tooltip title="Back">
            <div className={classes.backButtonWrapper}>
                <Button
                    variant="ternary"
                    startIcon={getIconUrlByName("ArrowBack")}
                    onClick={onBack}
                    disabled={!canGoBack}
                    className={cx(
                        classes.backButton,
                        !canGoBack && classes.backButtonDisabled
                    )}
                    aria-label="Back"
                >
                    <span className={classes.srOnly}>Back</span>
                </Button>
            </div>
        </Tooltip>
    );
});

export type S3PathIconActionButtonProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    label: string;
    iconName: Parameters<typeof getIconUrlByName>[0];
    onClick?: () => void;
    disabled?: boolean;
};

export const S3PathIconActionButton = memo((props: S3PathIconActionButtonProps) => {
    const { classes, cx, label, iconName, onClick, disabled = false } = props;
    const isDisabled = disabled || !onClick;

    return (
        <Tooltip title={label}>
            <div className={classes.backButtonWrapper}>
                <Button
                    variant="ternary"
                    startIcon={getIconUrlByName(iconName)}
                    onClick={onClick}
                    disabled={isDisabled}
                    className={cx(
                        classes.backButton,
                        isDisabled && classes.backButtonDisabled
                    )}
                    aria-label={label}
                >
                    <span className={classes.srOnly}>{label}</span>
                </Button>
            </div>
        </Tooltip>
    );
});

export type S3PathSegmentVariant = "root" | "bucket" | "prefix";

export type S3PathSegmentProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    variant: S3PathSegmentVariant;
    label: string;
    isCurrent?: boolean;
    onClick?: () => void;
    onFocus?: () => void;
    disabled?: boolean;
    dataPath?: string;
    ariaLabel?: string;
};

export const S3PathSegment = memo((props: S3PathSegmentProps) => {
    const {
        classes,
        cx,
        variant,
        label,
        isCurrent,
        onClick,
        onFocus,
        disabled,
        dataPath,
        ariaLabel
    } = props;

    const isRoot = variant === "root";
    const isBucket = variant === "bucket";
    const isPrefix = variant === "prefix";
    const showIconContainer = isRoot || isBucket;

    return (
        <button
            type="button"
            className={cx(
                classes.segmentButton,
                isRoot && classes.segmentRoot,
                isBucket && classes.segmentBucket,
                isPrefix && classes.segmentPrefix,
                isCurrent && classes.segmentCurrent
            )}
            data-s3-path={dataPath}
            aria-label={ariaLabel}
            onClick={onClick}
            onFocus={onFocus}
            disabled={disabled}
        >
            {showIconContainer && (
                <span
                    className={cx(
                        classes.segmentIcon,
                        isRoot && classes.segmentIconRoot,
                        isBucket && classes.segmentIconBucket,
                        isPrefix && classes.segmentIconPrefix
                    )}
                />
            )}
            <span className={classes.segmentLabel}>{label}</span>
        </button>
    );
});

export type S3PathCrumbProps = {
    crumb: Crumb;
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    onClick?: () => void;
    onFocus?: () => void;
    disabled?: boolean;
    dataPath?: string;
    ariaLabel?: string;
    wrapperRef?: Ref<HTMLSpanElement>;
};

export const S3PathCrumb = memo((props: S3PathCrumbProps) => {
    const {
        crumb,
        classes,
        cx,
        onClick,
        onFocus,
        disabled,
        dataPath,
        ariaLabel,
        wrapperRef
    } = props;
    const isEllipsis = crumb.kind === "ellipsis";
    const variant: S3PathSegmentVariant =
        crumb.kind === "root" ? "root" : crumb.kind === "bucket" ? "bucket" : "prefix";

    return (
        <span ref={wrapperRef} className={classes.crumbItem}>
            {isEllipsis ? (
                <span className={classes.ellipsis}>...</span>
            ) : (
                <S3PathSegment
                    classes={classes}
                    cx={cx}
                    variant={variant}
                    label={crumb.label}
                    isCurrent={crumb.isCurrent}
                    onClick={onClick}
                    onFocus={onFocus}
                    disabled={disabled}
                    dataPath={dataPath}
                    ariaLabel={ariaLabel}
                />
            )}
        </span>
    );
});

export type S3PathCrumbListProps = {
    crumbs: Crumb[];
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    hasTrailingSlash: boolean;
    onCrumbClick?: (crumb: Crumb) => void;
    onCrumbFocus?: (crumb: Crumb) => void;
    buttonDisabled?: boolean;
    withAriaLabel?: boolean;
    withDataPath?: boolean;
    getWrapperRef?: (index: number) => (el: HTMLSpanElement | null) => void;
    separatorRef?: Ref<HTMLSpanElement>;
};

export const S3PathCrumbList = memo((props: S3PathCrumbListProps) => {
    const {
        crumbs,
        classes,
        cx,
        hasTrailingSlash,
        onCrumbClick,
        onCrumbFocus,
        buttonDisabled,
        withAriaLabel,
        withDataPath,
        getWrapperRef,
        separatorRef
    } = props;

    return (
        <>
            {crumbs.map((crumb, index) => {
                const isEllipsis = crumb.kind === "ellipsis";

                return (
                    <Fragment key={`${crumb.path}-${index}`}>
                        <S3PathCrumb
                            crumb={crumb}
                            classes={classes}
                            cx={cx}
                            onClick={
                                onCrumbClick && !isEllipsis
                                    ? () => onCrumbClick(crumb)
                                    : undefined
                            }
                            onFocus={
                                onCrumbFocus && !isEllipsis
                                    ? () => onCrumbFocus(crumb)
                                    : undefined
                            }
                            disabled={buttonDisabled}
                            dataPath={
                                withDataPath && !isEllipsis ? crumb.path : undefined
                            }
                            ariaLabel={
                                withAriaLabel && !isEllipsis
                                    ? `Go to ${crumb.path}`
                                    : undefined
                            }
                            wrapperRef={getWrapperRef ? getWrapperRef(index) : undefined}
                        />
                        {index < crumbs.length - 1 && (
                            <span
                                ref={index === 0 ? separatorRef : undefined}
                                className={classes.separator}
                            >
                                /
                            </span>
                        )}
                    </Fragment>
                );
            })}
            {hasTrailingSlash && crumbs.length > 0 && (
                <span className={classes.separator}>/</span>
            )}
        </>
    );
});

export type S3PathBreadcrumbsProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    crumbs: Crumb[];
    displayCrumbs: Crumb[];
    hasTrailingSlash: boolean;
    isInteractive: boolean;
    pathDisplayRef: Ref<HTMLDivElement>;
    onCrumbNavigate: (path: string) => void;
    onCrumbFocus: (path: string) => void;
    measureCrumbRefs: MutableRefObject<Array<HTMLSpanElement | null>>;
    measureSeparatorRef: MutableRefObject<HTMLSpanElement | null>;
    measureEllipsisRef: MutableRefObject<HTMLSpanElement | null>;
};

export const S3PathBreadcrumbs = memo((props: S3PathBreadcrumbsProps) => {
    const {
        classes,
        cx,
        crumbs,
        displayCrumbs,
        hasTrailingSlash,
        isInteractive,
        pathDisplayRef,
        onCrumbNavigate,
        onCrumbFocus,
        measureCrumbRefs,
        measureSeparatorRef,
        measureEllipsisRef
    } = props;

    const visibleCrumbs = displayCrumbs.length === 0 ? crumbs : displayCrumbs;

    return (
        <nav className={classes.pathDisplay} aria-label="S3 path" ref={pathDisplayRef}>
            {crumbs.length === 0 ? (
                <span className={classes.emptyValue}>No path</span>
            ) : (
                <div className={classes.crumbs}>
                    <S3PathCrumbList
                        crumbs={visibleCrumbs}
                        classes={classes}
                        cx={cx}
                        hasTrailingSlash={hasTrailingSlash}
                        onCrumbClick={crumb => {
                            if (!isInteractive) {
                                return;
                            }
                            onCrumbNavigate(crumb.path);
                        }}
                        onCrumbFocus={crumb => onCrumbFocus(crumb.path)}
                        buttonDisabled={!isInteractive}
                        withAriaLabel
                        withDataPath
                    />
                </div>
            )}
            {crumbs.length > 0 && (
                <div className={classes.measure} aria-hidden="true">
                    <div className={classes.crumbs}>
                        <S3PathCrumbList
                            crumbs={crumbs}
                            classes={classes}
                            cx={cx}
                            hasTrailingSlash={false}
                            buttonDisabled={false}
                            getWrapperRef={index => el => {
                                measureCrumbRefs.current[index] = el;
                            }}
                            separatorRef={measureSeparatorRef}
                        />
                    </div>
                    <span ref={measureEllipsisRef} className={classes.ellipsis}>
                        ...
                    </span>
                </div>
            )}
        </nav>
    );
});

export type S3PathEditInputProps = {
    classes: S3PathControlClasses;
    inputId: string;
    inputRef: Ref<HTMLInputElement>;
    value: string;
    onChange: (nextValue: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    isInteractive: boolean;
    errorText: string | null;
    errorId: string;
};

export const S3PathEditInput = memo((props: S3PathEditInputProps) => {
    const {
        classes,
        inputId,
        inputRef,
        value,
        onChange,
        onKeyDown,
        isInteractive,
        errorText,
        errorId
    } = props;

    return (
        <div className={classes.inputWrapper}>
            <label htmlFor={inputId} className={classes.srOnly}>
                S3 path
            </label>
            <input
                ref={inputRef}
                id={inputId}
                className={classes.input}
                type="text"
                value={value}
                onChange={event => onChange(event.target.value)}
                onKeyDown={onKeyDown}
                aria-invalid={errorText ? true : undefined}
                aria-describedby={errorText ? errorId : undefined}
                disabled={!isInteractive}
                autoComplete="off"
                spellCheck={false}
            />
        </div>
    );
});

export type S3PathReadActionsProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    isInteractive: boolean;
    onCopy: () => void;
    onBookmark?: () => void;
    onEdit: () => void;
    onEditFocus: () => void;
    editButtonRef: Ref<HTMLButtonElement>;
};

export const S3PathReadActions = memo((props: S3PathReadActionsProps) => {
    const {
        classes,
        cx,
        isInteractive,
        onCopy,
        onBookmark,
        onEdit,
        onEditFocus,
        editButtonRef
    } = props;

    return (
        <>
            <Tooltip title="Copy path">
                <div>
                    <IconButton
                        aria-label="Copy S3 path to clipboard"
                        icon={getIconUrlByName("ContentCopy")}
                        onClick={onCopy}
                        disabled={!isInteractive}
                        className={cx(
                            classes.iconAction,
                            !isInteractive && classes.iconActionDisabled
                        )}
                    />
                </div>
            </Tooltip>
            {onBookmark && (
                <Tooltip title="Pin">
                    <div>
                        <IconButton
                            aria-label="Pin S3 path"
                            icon={getIconUrlByName("PushPin")}
                            onClick={onBookmark}
                            disabled={!isInteractive}
                            className={cx(
                                classes.iconAction,
                                !isInteractive && classes.iconActionDisabled
                            )}
                        />
                    </div>
                </Tooltip>
            )}
            <Tooltip title="Edit">
                <div>
                    <IconButton
                        aria-label="Edit S3 path"
                        icon={getIconUrlByName("Edit")}
                        onClick={onEdit}
                        disabled={!isInteractive}
                        className={cx(
                            classes.iconAction,
                            !isInteractive && classes.iconActionDisabled
                        )}
                        onFocus={onEditFocus}
                        ref={editButtonRef}
                    />
                </div>
            </Tooltip>
        </>
    );
});

export type S3PathEditActionsProps = {
    isInteractive: boolean;
    onCancel: () => void;
    onValidate: () => void;
};

export type S3PathActionButtonVariant = "primary" | "secondary" | "tertiary";

export type S3PathActionButtonProps = {
    variant: S3PathActionButtonVariant;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
};

export const S3PathActionButton = memo((props: S3PathActionButtonProps) => {
    const { variant, label, onClick, disabled, ariaLabel, className } = props;

    return (
        <Button
            variant={
                variant === "primary"
                    ? "primary"
                    : variant === "secondary"
                      ? "secondary"
                      : "ternary"
            }
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel ?? label}
            className={className}
            data-variant={variant}
        >
            {label}
        </Button>
    );
});

export const S3PathEditActions = memo((props: S3PathEditActionsProps) => {
    const { isInteractive, onCancel, onValidate } = props;
    const { classes, cx } = useStyles();

    return (
        <>
            <S3PathActionButton
                variant="tertiary"
                label="Cancel"
                onClick={onCancel}
                disabled={!isInteractive}
                ariaLabel="Cancel editing"
                className={cx(classes.actionButton, classes.cancelButton)}
            />
            <S3PathActionButton
                variant="secondary"
                label="Validate"
                onClick={onValidate}
                disabled={!isInteractive}
                ariaLabel="Validate S3 path"
                className={classes.actionButton}
            />
        </>
    );
});

export type S3PathValidatingStatusProps = {
    classes: S3PathControlClasses;
};

export const S3PathValidatingStatus = memo((props: S3PathValidatingStatusProps) => {
    const { classes } = props;

    return (
        <div className={classes.validating}>
            <CircularProgress size={16} className={classes.spinner} />
            <span>Validating path…</span>
        </div>
    );
});

export type S3PathActionsProps = {
    classes: S3PathControlClasses;
    cx: S3PathControlCx;
    mode: Mode;
    isInteractive: boolean;
    onCopy: () => void;
    onBookmark?: () => void;
    onEdit: () => void;
    onEditFocus: () => void;
    editButtonRef: Ref<HTMLButtonElement>;
    onCancel: () => void;
    onValidate: () => void;
};

export const S3PathActions = memo((props: S3PathActionsProps) => {
    const {
        classes,
        cx,
        mode,
        isInteractive,
        onCopy,
        onBookmark,
        onEdit,
        onEditFocus,
        editButtonRef,
        onCancel,
        onValidate
    } = props;

    return (
        <div className={classes.actions}>
            {mode === "read" ? (
                <S3PathReadActions
                    classes={classes}
                    cx={cx}
                    isInteractive={isInteractive}
                    onCopy={onCopy}
                    onBookmark={onBookmark}
                    onEdit={onEdit}
                    onEditFocus={onEditFocus}
                    editButtonRef={editButtonRef}
                />
            ) : mode === "validating" ? (
                <S3PathValidatingStatus classes={classes} />
            ) : (
                <S3PathEditActions
                    isInteractive={isInteractive}
                    onCancel={onCancel}
                    onValidate={onValidate}
                />
            )}
        </div>
    );
});

export type S3PathInfoMessageProps = {
    classes: S3PathControlClasses;
    message: string;
};

export type S3PathMessageVariant = "success" | "info" | "error";

export type S3PathMessageProps = {
    classes: S3PathControlClasses;
    variant: S3PathMessageVariant;
    message: string;
    messageId?: string;
};

export const S3PathMessage = memo((props: S3PathMessageProps) => {
    const { classes, variant, message, messageId } = props;

    const className =
        variant === "error"
            ? classes.errorMessage
            : variant === "success"
              ? classes.successMessage
              : classes.infoMessage;

    const role = variant === "error" ? "alert" : "status";

    return (
        <div className={className} role={role} id={messageId}>
            {message}
        </div>
    );
});

export const S3PathInfoMessage = memo((props: S3PathInfoMessageProps) => {
    const { classes, message } = props;

    return <S3PathMessage classes={classes} variant="info" message={message} />;
});

export type S3PathErrorMessageProps = {
    classes: S3PathControlClasses;
    message: string;
    errorId: string;
};

export const S3PathErrorMessage = memo((props: S3PathErrorMessageProps) => {
    const { classes, message, errorId } = props;

    return (
        <S3PathMessage
            classes={classes}
            variant="error"
            message={message}
            messageId={errorId}
        />
    );
});

export type S3PathLiveStatusProps = {
    classes: S3PathControlClasses;
    statusId: string;
    message: string | null;
};

export const S3PathLiveStatus = memo((props: S3PathLiveStatusProps) => {
    const { classes, statusId, message } = props;

    return (
        <div className={classes.srOnly} role="status" aria-live="polite" id={statusId}>
            {message ?? ""}
        </div>
    );
});

export const S3PathControl = memo((props: S3PathControlProps) => {
    const {
        value,
        onNavigate,
        validatePath,
        onError,
        onCopy,
        onBookmark,
        onCreatePrefix,
        onImportData,
        disabled
    } = props;

    const [mode, setMode] = useState<Mode>("read");
    const [draftValue, setDraftValue] = useState(value);
    const [error, setError] = useState<ValidationError | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const inputId = useId();
    const errorId = useId();
    const statusId = useId();

    const inputRef = useRef<HTMLInputElement>(null);
    const editButtonRef = useRef<HTMLButtonElement>(null);
    const lastFocusedPathRef = useRef<string | null>(null);
    const validationIdRef = useRef(0);
    const infoTimeoutRef = useRef<number | undefined>(undefined);
    const measureCrumbRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const measureSeparatorRef = useRef<HTMLSpanElement | null>(null);
    const measureEllipsisRef = useRef<HTMLSpanElement | null>(null);
    const { domRect: pathDisplayRect, ref: pathDisplayRef } = useDomRect();
    const [displayCrumbs, setDisplayCrumbs] = useState<Crumb[]>([]);
    const prevModeRef = useRef<Mode>(mode);

    useEffect(() => {
        const previousMode = prevModeRef.current;
        prevModeRef.current = mode;

        if (mode !== "read" || previousMode === "read") {
            return;
        }

        setDraftValue(value);
    }, [value, mode]);

    useEffect(() => {
        if (mode !== "edit") {
            return;
        }

        const input = inputRef.current;

        if (!input) {
            return;
        }

        input.focus();
        input.select();
    }, [mode]);

    const { segments, scheme, hasTrailingSlash } = useMemo(
        () => buildSegments(value),
        [value]
    );

    const crumbs: Crumb[] = useMemo(() => {
        if (!scheme) {
            return segments.map(segment => ({
                label: segment.label,
                path: segment.path,
                kind: "unknown",
                isCurrent: segment.isCurrent
            }));
        }

        const items: Crumb[] = [
            {
                label: scheme,
                path: "s3://",
                kind: "root",
                isCurrent: segments.length === 0
            }
        ];

        segments.forEach((segment, index) => {
            if (index === 0) {
                items.push({
                    label: segment.label,
                    path: segment.path,
                    kind: "bucket",
                    isCurrent: segment.isCurrent
                });
                return;
            }

            const isLast = index === segments.length - 1;
            const isObject = isLast && !hasTrailingSlash;

            items.push({
                label: segment.label,
                path: segment.path,
                kind: isObject ? "object" : "prefix",
                isCurrent: segment.isCurrent
            });
        });

        return items;
    }, [scheme, segments, hasTrailingSlash]);

    const isReadMode = mode === "read";
    const isEditMode = mode === "edit";
    const isValidating = mode === "validating";
    const isInteractive = !disabled && !isValidating;
    const parentPath = useMemo(() => getParentPath(value), [value]);
    const canGoBack = isReadMode && isInteractive && parentPath !== null;
    const canUseLeadingActions = isReadMode && isInteractive;

    const { classes, cx } = useStyles();

    useEffect(() => {
        if (!infoMessage) {
            return;
        }

        if (infoTimeoutRef.current !== undefined) {
            window.clearTimeout(infoTimeoutRef.current);
        }

        infoTimeoutRef.current = window.setTimeout(() => {
            setInfoMessage(null);
        }, 2000);

        return () => {
            if (infoTimeoutRef.current !== undefined) {
                window.clearTimeout(infoTimeoutRef.current);
            }
        };
    }, [infoMessage]);

    useEffect(() => {
        if (!isReadMode) {
            setDisplayCrumbs(crumbs);
            return;
        }

        const availableWidth = pathDisplayRect.width;

        if (!availableWidth || crumbs.length === 0) {
            setDisplayCrumbs(crumbs);
            return;
        }

        const separatorWidth =
            measureSeparatorRef.current?.getBoundingClientRect().width ?? 0;
        const ellipsisWidth =
            measureEllipsisRef.current?.getBoundingClientRect().width ?? 0;
        const crumbWidths = crumbs.map(
            (_, index) =>
                measureCrumbRefs.current[index]?.getBoundingClientRect().width ?? 0
        );

        const totalWidth =
            crumbWidths.reduce((sum, width) => sum + width, 0) +
            separatorWidth * Math.max(crumbs.length - 1, 0) +
            (hasTrailingSlash ? separatorWidth : 0);

        if (totalWidth <= availableWidth) {
            setDisplayCrumbs(crumbs);
            return;
        }

        if (crumbs.length < 2) {
            setDisplayCrumbs(crumbs);
            return;
        }

        const rootIndex = 0;
        const bucketIndex = Math.min(1, crumbs.length - 1);
        const lastIndex = crumbs.length - 1;

        const ellipsisCrumb: Crumb = {
            label: "...",
            path: "",
            kind: "ellipsis",
            isCurrent: false
        };

        let widthSum = crumbWidths[rootIndex] ?? 0;

        if (bucketIndex !== rootIndex) {
            widthSum += separatorWidth + (crumbWidths[bucketIndex] ?? 0);
        }

        const shouldUseEllipsis = lastIndex > bucketIndex;

        if (shouldUseEllipsis) {
            widthSum += separatorWidth + ellipsisWidth;
        }

        if (lastIndex !== bucketIndex) {
            widthSum += separatorWidth + (crumbWidths[lastIndex] ?? 0);
        }

        const tailIndices: number[] = [];

        if (lastIndex - 1 > bucketIndex) {
            for (let index = lastIndex - 1; index > bucketIndex; index -= 1) {
                const nextWidth = widthSum + separatorWidth + (crumbWidths[index] ?? 0);

                if (nextWidth > availableWidth) {
                    break;
                }

                tailIndices.unshift(index);
                widthSum = nextWidth;
            }
        }

        const collapsed: Crumb[] = [];
        collapsed.push(crumbs[rootIndex]);

        if (bucketIndex !== rootIndex) {
            collapsed.push(crumbs[bucketIndex]);
        }

        if (shouldUseEllipsis) {
            collapsed.push(ellipsisCrumb);
        }

        tailIndices.forEach(index => collapsed.push(crumbs[index]));

        if (lastIndex !== bucketIndex && !tailIndices.includes(lastIndex)) {
            collapsed.push(crumbs[lastIndex]);
        }

        setDisplayCrumbs(collapsed);
    }, [crumbs, hasTrailingSlash, isReadMode, pathDisplayRect.width]);

    const handleCopy = async () => {
        if (!isReadMode || disabled) {
            return;
        }

        try {
            await navigator.clipboard?.writeText(value);
        } catch {
            // Ignore clipboard errors.
        }

        setInfoMessage(copyMessage);
        onCopy?.(value);
    };

    const handleBookmark = () => {
        if (!isReadMode || disabled) {
            return;
        }

        onBookmark?.(value);
    };

    const handleCreatePrefix = () => {
        if (!isReadMode || disabled) {
            return;
        }

        onCreatePrefix?.(value);
    };

    const handleImportData = () => {
        if (!isReadMode || disabled) {
            return;
        }

        onImportData?.(value);
    };

    const handleEdit = () => {
        if (!isReadMode || disabled) {
            return;
        }

        setInfoMessage(null);
        setError(null);
        setDraftValue(value);
        setMode("edit");
    };

    const handleCancel = () => {
        if (!isEditMode) {
            return;
        }

        setError(null);
        setDraftValue(value);
        setMode("read");
    };

    const { ref: barRef } = useClickAway({
        onClickAway: () => {
            if (!isEditMode) {
                return;
            }

            handleCancel();
        }
    });

    useEffect(() => {
        if (mode !== "read") {
            return;
        }

        const focusTarget = () => {
            const container = barRef.current;

            if (container && lastFocusedPathRef.current) {
                const buttons =
                    container.querySelectorAll<HTMLButtonElement>("button[data-s3-path]");
                const match = Array.from(buttons).find(
                    button => button.dataset.s3Path === lastFocusedPathRef.current
                );

                if (match) {
                    match.focus();
                    return;
                }
            }

            editButtonRef.current?.focus();
        };

        const timeoutId = window.setTimeout(focusTarget, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [mode, value, displayCrumbs, barRef]);

    const handleValidate = async () => {
        if (!isEditMode || disabled) {
            return;
        }

        setError(null);
        setMode("validating");

        const validationId = ++validationIdRef.current;

        try {
            const result = await validatePath(draftValue);

            if (validationId !== validationIdRef.current) {
                return;
            }

            if (result.status === "success") {
                setInfoMessage(null);
                setMode("read");
                onNavigate(result.resolvedPath);
                return;
            }

            if (result.status === "empty") {
                setInfoMessage(emptyMessage);
                setMode("read");
                onNavigate(result.resolvedPath);
                return;
            }

            setError(result.error);
            setMode("edit");
            onError?.(result.error);
        } catch {
            if (validationId !== validationIdRef.current) {
                return;
            }

            const normalizedError: ValidationError = { code: "UNKNOWN" };

            setError(normalizedError);
            setMode("edit");
            onError?.(normalizedError);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleValidate();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
        }
    };

    const handleBarDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!isReadMode || !isInteractive) {
            return;
        }

        if (event.target instanceof HTMLElement && event.target.closest("button")) {
            return;
        }

        handleEdit();
    };

    const handleBack = () => {
        if (!canGoBack || parentPath === null) {
            return;
        }

        setInfoMessage(null);
        onNavigate(parentPath);
    };

    const errorMessage = error ? (error.message ?? errorMessages[error.code]) : null;
    const errorText = errorMessage ? `Error: ${errorMessage}` : null;
    const statusMessage = isValidating ? "Validating path…" : (infoMessage ?? null);

    return (
        <div className={classes.root} aria-busy={isValidating}>
            <div className={classes.row}>
                <div className={classes.leadingActions}>
                    <S3PathBackButton
                        classes={classes}
                        cx={cx}
                        canGoBack={canGoBack}
                        onBack={handleBack}
                    />
                </div>

                <div
                    className={cx(
                        classes.bar,
                        isReadMode && isInteractive && classes.barInteractive,
                        !isReadMode && classes.barEditing,
                        errorMessage && classes.barError,
                        errorMessage && !isReadMode && classes.barEditingError,
                        disabled && classes.barDisabled
                    )}
                    onDoubleClick={handleBarDoubleClick}
                    ref={barRef}
                >
                    {isReadMode ? (
                        <S3PathBreadcrumbs
                            classes={classes}
                            cx={cx}
                            crumbs={crumbs}
                            displayCrumbs={displayCrumbs}
                            hasTrailingSlash={hasTrailingSlash}
                            isInteractive={isInteractive}
                            pathDisplayRef={pathDisplayRef}
                            onCrumbNavigate={path => {
                                setInfoMessage(null);
                                onNavigate(path);
                            }}
                            onCrumbFocus={path => {
                                lastFocusedPathRef.current = path;
                            }}
                            measureCrumbRefs={measureCrumbRefs}
                            measureSeparatorRef={measureSeparatorRef}
                            measureEllipsisRef={measureEllipsisRef}
                        />
                    ) : (
                        <S3PathEditInput
                            classes={classes}
                            inputId={inputId}
                            inputRef={inputRef}
                            value={draftValue}
                            onChange={setDraftValue}
                            onKeyDown={handleKeyDown}
                            isInteractive={isInteractive}
                            errorText={errorText}
                            errorId={errorId}
                        />
                    )}

                    <S3PathActions
                        classes={classes}
                        cx={cx}
                        mode={mode}
                        isInteractive={isInteractive}
                        onCopy={handleCopy}
                        onBookmark={onBookmark ? handleBookmark : undefined}
                        onEdit={handleEdit}
                        onEditFocus={() => {
                            lastFocusedPathRef.current = null;
                        }}
                        editButtonRef={editButtonRef}
                        onCancel={handleCancel}
                        onValidate={handleValidate}
                    />
                </div>
                <div className={classes.trailingActions}>
                    {onCreatePrefix && (
                        <S3PathIconActionButton
                            classes={classes}
                            cx={cx}
                            label="Create prefix"
                            iconName="CreateNewFolder"
                            onClick={handleCreatePrefix}
                            disabled={!canUseLeadingActions}
                        />
                    )}
                    {onImportData && (
                        <S3PathIconActionButton
                            classes={classes}
                            cx={cx}
                            label="Import data"
                            iconName="UploadFile"
                            onClick={handleImportData}
                            disabled={!canUseLeadingActions}
                        />
                    )}
                </div>
            </div>

            {isReadMode && infoMessage && (
                <S3PathInfoMessage classes={classes} message={infoMessage} />
            )}

            {isEditMode && errorText && (
                <S3PathErrorMessage
                    classes={classes}
                    message={errorText}
                    errorId={errorId}
                />
            )}

            <S3PathLiveStatus
                classes={classes}
                statusId={statusId}
                message={statusMessage}
            />
        </div>
    );
});

export const useStyles = tss.withName({ S3PathControl }).create(({ theme }) => {
    const controlHeight = "56px";

    return {
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            width: "100%"
        },
        row: {
            display: "flex",
            alignItems: "stretch",
            gap: theme.spacing(2),
            width: "100%"
        },
        leadingActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1)
        },
        trailingActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1)
        },
        bar: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(3),
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "8px",
            paddingRight: theme.spacing(3),
            borderRadius: "16px",
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
            flex: 1,
            minWidth: 0,
            height: controlHeight,
            minHeight: controlHeight,
            maxHeight: controlHeight,
            boxSizing: "border-box"
        },
        barInteractive: {
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                boxShadow: theme.shadows[6]
            }
        },
        barEditing: {
            borderColor: theme.colors.useCases.surfaces.surface2,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: `inset 0 -2px 0 ${theme.colors.useCases.buttons.actionActive}`
        },
        barEditingError: {
            boxShadow: `inset 0 -2px 0 ${theme.colors.useCases.alertSeverity.error.main}`
        },
        barError: {
            borderColor: theme.colors.useCases.alertSeverity.error.main
        },
        barDisabled: {
            opacity: 0.6
        },
        pathDisplay: {
            position: "relative",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            color: theme.colors.useCases.typography.textPrimary
        },
        crumbs: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(3)
        },
        crumbItem: {
            display: "inline-flex",
            alignItems: "center"
        },
        emptyValue: {
            color: theme.colors.useCases.typography.textSecondary
        },
        separator: {
            margin: `0 ${theme.spacing(2)}`,
            color: theme.colors.useCases.typography.textSecondary
        },
        segmentButton: {
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "10px",
            paddingRight: "10px",
            margin: 0,
            border: "none",
            background: "none",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
            textDecoration: "none",
            borderRadius: theme.spacing(3),
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            "&:disabled": {
                cursor: "default",
                color: theme.colors.useCases.typography.textDisabled,
                backgroundColor: "transparent"
            }
        },
        segmentCurrent: {
            fontWeight: 600
        },
        segmentRoot: {
            fontWeight: 600
        },
        segmentBucket: {
            fontWeight: 600
        },
        segmentPrefix: {},
        segmentIcon: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "8px",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        },
        segmentIconRoot: {
            backgroundColor: theme.colors.useCases.alertSeverity.warning.main,
            color: theme.colors.useCases.surfaces.background
        },
        segmentIconBucket: {},
        segmentIconPrefix: {},
        segmentLabel: {
            display: "inline-block"
        },
        backButtonWrapper: {
            display: "flex",
            alignItems: "center",
            height: controlHeight,
            minHeight: controlHeight
        },
        backButton: {
            "&&": {
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                width: "32px",
                minWidth: "32px",
                padding: 0
            },
            borderRadius: "10px",
            aspectRatio: "1 / 1",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface1
            },
            "& .MuiButton-startIcon": {
                margin: 0,
                color: theme.colors.useCases.typography.textSecondary
            },
            "&:hover .MuiButton-startIcon": {
                color: theme.colors.useCases.buttons.actionActive
            }
        },
        backButtonDisabled: {
            opacity: 0.4,
            pointerEvents: "none"
        },
        inputWrapper: {
            flex: 1,
            minWidth: 0
        },
        input: {
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            font: "inherit",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: theme.colors.useCases.typography.textPrimary
        },
        actions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            flexShrink: 0
        },
        actionButton: {
            "&&": {
                boxSizing: "border-box",
                height: "28px",
                minHeight: "28px",
                maxHeight: "28px",
                padding: `0 ${theme.spacing(4)}`,
                lineHeight: "28px"
            },
            '&[data-variant="primary"]': {
                border: "none",
                boxShadow: `inset 0 0 0 2px ${theme.colors.useCases.buttons.actionActive}`
            }
        },
        cancelButton: {
            border: "1px solid transparent"
        },
        iconAction: {
            borderRadius: "10px",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            width: "32px",
            height: "32px",
            minWidth: "32px",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface1
            }
        },
        iconActionDisabled: {
            opacity: 0.4,
            pointerEvents: "none"
        },
        srOnly: {
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0
        },
        measure: {
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            left: 0,
            top: 0
        },
        ellipsis: {
            color: theme.colors.useCases.typography.textSecondary,
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`
        },
        validating: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            color: theme.colors.useCases.typography.textSecondary
        },
        spinner: {
            color: theme.colors.useCases.typography.textSecondary
        },
        infoMessage: {
            color: theme.colors.useCases.typography.textSecondary,
            marginLeft: theme.spacing(1),
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            borderRadius: theme.spacing(2),
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            alignSelf: "flex-start"
        },
        successMessage: {
            color: theme.colors.useCases.alertSeverity.success.main,
            marginLeft: theme.spacing(1),
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            borderRadius: theme.spacing(2),
            backgroundColor: theme.colors.useCases.alertSeverity.success.background,
            alignSelf: "flex-start"
        },
        errorMessage: {
            color: theme.colors.useCases.alertSeverity.error.main,
            marginLeft: theme.spacing(1)
        }
    };
});
