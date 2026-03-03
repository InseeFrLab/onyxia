import {
    Fragment,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type FocusEvent,
    type KeyboardEvent,
    type PointerEvent
} from "react";
import { tss } from "tss";
import { Tooltip } from "onyxia-ui/Tooltip";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { useDomRect } from "powerhooks/useDomRect";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import s3UriBucketSvgUrl from "ui/assets/svg/S3UriBucket.svg";
import s3UriHomeSvgUrl from "ui/assets/svg/S3UriHome.svg";

export type S3UriBarProps = {
    className?: string;
    s3UriPrefix: S3Uri.Prefix;
    isEditing: boolean;
    onS3UriPrefixChange: (params: { s3UriPrefix: S3Uri.Prefix }) => void;
    onIsEditingChange: (params: { isEditing: boolean }) => void;
    hints: {
        type: "object" | "key-segment";
        name: string;
    }[];
    isBookmarked: boolean;
    onToggleBookmark?: () => void;
};

type NavigationCrumb = {
    label: string;
    kind: "root" | "bucket" | "segment";
    s3UriPrefix: S3Uri.Prefix;
    isCurrent: boolean;
};

type DisplayCrumb =
    | NavigationCrumb
    | {
          label: "...";
          kind: "ellipsis";
      };

const longPressDelayMs = 200;
type CrumbKind = DisplayCrumb["kind"];

function getSeparatorTokenBetweenKinds(params: {
    leftKind: CrumbKind;
    rightKind: CrumbKind;
    delimiter: string;
}): string | undefined {
    const { leftKind, rightKind, delimiter } = params;

    if (leftKind === "root" && rightKind === "bucket") {
        return undefined;
    }

    if (leftKind === "bucket") {
        return "/";
    }

    return delimiter;
}

function shouldShowSeparatorAtIndex(
    crumbs: Array<{ kind: CrumbKind }>,
    index: number,
    delimiter: string
): boolean {
    if (index >= crumbs.length - 1) {
        return false;
    }

    return (
        getSeparatorTokenBetweenKinds({
            leftKind: crumbs[index].kind,
            rightKind: crumbs[index + 1].kind,
            delimiter
        }) !== undefined
    );
}

function getSeparatorCount(
    crumbs: Array<{ kind: CrumbKind }>,
    delimiter: string
): number {
    let count = 0;

    for (let index = 0; index < crumbs.length - 1; index += 1) {
        if (shouldShowSeparatorAtIndex(crumbs, index, delimiter)) {
            count += 1;
        }
    }

    return count;
}

function getTrailingSeparatorToken(s3UriPrefix: S3Uri.Prefix): string | undefined {
    if (!s3UriPrefix.isDelimiterTerminated) {
        return undefined;
    }

    if (s3UriPrefix.keySegments.length === 0) {
        return "/";
    }

    return s3UriPrefix.delimiter;
}

function getSeparatorWidthForKinds(params: {
    leftKind: CrumbKind;
    rightKind: CrumbKind;
    delimiter: string;
    slashSeparatorWidth: number;
    delimiterSeparatorWidth: number;
}): number {
    const {
        leftKind,
        rightKind,
        delimiter,
        slashSeparatorWidth,
        delimiterSeparatorWidth
    } = params;
    const token = getSeparatorTokenBetweenKinds({
        leftKind,
        rightKind,
        delimiter
    });

    if (token === undefined) {
        return 0;
    }

    return token === "/" ? slashSeparatorWidth : delimiterSeparatorWidth;
}

function getBucketRootPrefix(params: {
    bucket: string;
    delimiter: string;
}): S3Uri.Prefix {
    const { bucket, delimiter } = params;

    return {
        type: "prefix",
        bucket,
        delimiter,
        keySegments: [],
        isDelimiterTerminated: true
    };
}

function tryParsePrefix(params: {
    s3Uri: string;
    delimiter: string;
}): S3Uri.Prefix | undefined {
    const { s3Uri, delimiter } = params;

    try {
        return parseS3Uri({
            value: s3Uri,
            delimiter,
            isPrefix: true
        });
    } catch {
        return undefined;
    }
}

function getBreadcrumbs(params: { s3UriPrefix: S3Uri.Prefix }): NavigationCrumb[] {
    const { s3UriPrefix } = params;
    const { bucket, delimiter } = s3UriPrefix;
    const bucketRootPrefix = getBucketRootPrefix({ bucket, delimiter });

    const segmentLabels = s3UriPrefix.isDelimiterTerminated
        ? s3UriPrefix.keySegments
        : [...s3UriPrefix.keySegments, s3UriPrefix.nextKeySegmentPrefix];

    const crumbs: NavigationCrumb[] = [
        {
            label: "s3://",
            kind: "root",
            s3UriPrefix: bucketRootPrefix,
            isCurrent: false
        },
        {
            label: bucket,
            kind: "bucket",
            s3UriPrefix: bucketRootPrefix,
            isCurrent: segmentLabels.length === 0
        }
    ];

    segmentLabels.forEach((segmentLabel, index) => {
        const isLast = index === segmentLabels.length - 1;

        const segmentPrefix: S3Uri.Prefix =
            isLast && !s3UriPrefix.isDelimiterTerminated
                ? {
                      type: "prefix",
                      bucket,
                      delimiter,
                      keySegments: [...s3UriPrefix.keySegments],
                      isDelimiterTerminated: false,
                      nextKeySegmentPrefix: s3UriPrefix.nextKeySegmentPrefix
                  }
                : {
                      type: "prefix",
                      bucket,
                      delimiter,
                      keySegments: segmentLabels.slice(0, index + 1),
                      isDelimiterTerminated: true
                  };

        crumbs.push({
            label: segmentLabel,
            kind: "segment",
            s3UriPrefix: segmentPrefix,
            isCurrent: isLast
        });
    });

    return crumbs;
}

export function S3UriBar(props: S3UriBarProps) {
    const {
        className,
        s3UriPrefix,
        isEditing,
        onS3UriPrefixChange,
        onIsEditingChange,
        hints,
        isBookmarked,
        onToggleBookmark
    } = props;

    const normalizedPrefix = s3UriPrefix;
    const canonicalS3Uri = useMemo(
        () => stringifyS3Uri(normalizedPrefix),
        [normalizedPrefix]
    );
    const crumbs = useMemo(
        () => getBreadcrumbs({ s3UriPrefix: normalizedPrefix }),
        [normalizedPrefix]
    );
    const trailingSeparatorToken = getTrailingSeparatorToken(normalizedPrefix);

    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const longPressTimeoutRef = useRef<number | undefined>(undefined);
    const longPressTriggeredRef = useRef(false);
    const wasEditingRef = useRef(isEditing);
    const ignoreNextBlurRef = useRef(false);
    const lastEnterEditRequestTimeRef = useRef(Number.NEGATIVE_INFINITY);

    const measureCrumbRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const measureSlashSeparatorRef = useRef<HTMLSpanElement | null>(null);
    const measureDelimiterSeparatorRef = useRef<HTMLSpanElement | null>(null);
    const measureEllipsisRef = useRef<HTMLSpanElement | null>(null);
    const { domRect: pathDisplayRect, ref: pathDisplayRef } = useDomRect();

    const [draftS3Uri, setDraftS3Uri] = useState(canonicalS3Uri);
    const [displayCrumbs, setDisplayCrumbs] = useState<DisplayCrumb[]>(crumbs);
    const [activeHintIndex, setActiveHintIndex] = useState(-1);

    const inputId = useId();
    const hintsListId = useId();

    const { classes, cx } = useStyles({ isEditing });

    useEffect(() => {
        if (!isEditing) {
            ignoreNextBlurRef.current = false;
            lastEnterEditRequestTimeRef.current = Number.NEGATIVE_INFINITY;
        }

        if (!isEditing || !wasEditingRef.current) {
            setDraftS3Uri(canonicalS3Uri);
        }

        wasEditingRef.current = isEditing;
    }, [canonicalS3Uri, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setActiveHintIndex(-1);
            return;
        }

        if (hints.length === 0) {
            setActiveHintIndex(-1);
            return;
        }

        setActiveHintIndex(index =>
            index >= hints.length ? hints.length - 1 : Math.max(index, 0)
        );
    }, [hints, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            const input = inputRef.current;

            if (!input) {
                return;
            }

            input.focus();
            const cursorPosition = input.value.length;
            input.setSelectionRange(cursorPosition, cursorPosition);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [isEditing]);

    useEffect(() => {
        if (isEditing) {
            setDisplayCrumbs(crumbs);
            return;
        }

        const availableWidth = pathDisplayRect.width;

        if (!availableWidth || crumbs.length === 0) {
            setDisplayCrumbs(crumbs);
            return;
        }

        const slashSeparatorWidth =
            measureSlashSeparatorRef.current?.getBoundingClientRect().width ?? 0;
        const delimiterSeparatorWidth =
            normalizedPrefix.delimiter === "/"
                ? slashSeparatorWidth
                : (measureDelimiterSeparatorRef.current?.getBoundingClientRect().width ??
                  slashSeparatorWidth);
        const separatorWidth = Math.max(slashSeparatorWidth, delimiterSeparatorWidth);
        const ellipsisWidth =
            measureEllipsisRef.current?.getBoundingClientRect().width ?? 0;
        const crumbWidths = crumbs.map(
            (_, index) =>
                measureCrumbRefs.current[index]?.getBoundingClientRect().width ?? 0
        );
        const separatorCount = getSeparatorCount(crumbs, normalizedPrefix.delimiter);
        const trailingSeparatorWidth =
            trailingSeparatorToken === undefined
                ? 0
                : trailingSeparatorToken === "/"
                  ? slashSeparatorWidth
                  : delimiterSeparatorWidth;

        const totalWidth =
            crumbWidths.reduce((sum, width) => sum + width, 0) +
            separatorWidth * separatorCount +
            trailingSeparatorWidth;

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

        const ellipsisCrumb: DisplayCrumb = {
            label: "...",
            kind: "ellipsis"
        };

        let widthSum = crumbWidths[rootIndex] ?? 0;

        if (bucketIndex !== rootIndex) {
            widthSum +=
                getSeparatorWidthForKinds({
                    leftKind: crumbs[rootIndex].kind,
                    rightKind: crumbs[bucketIndex].kind,
                    delimiter: normalizedPrefix.delimiter,
                    slashSeparatorWidth,
                    delimiterSeparatorWidth
                }) + (crumbWidths[bucketIndex] ?? 0);
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

        const collapsed: DisplayCrumb[] = [];
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
    }, [
        crumbs,
        isEditing,
        normalizedPrefix.delimiter,
        pathDisplayRect.width,
        trailingSeparatorToken
    ]);

    useEffect(() => {
        return () => {
            if (longPressTimeoutRef.current !== undefined) {
                window.clearTimeout(longPressTimeoutRef.current);
            }
        };
    }, []);

    const clearLongPressTimeout = () => {
        if (longPressTimeoutRef.current === undefined) {
            return;
        }

        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = undefined;
    };

    const startLongPressTimer = () => {
        clearLongPressTimeout();
        longPressTriggeredRef.current = false;

        longPressTimeoutRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            lastEnterEditRequestTimeRef.current = performance.now();
            onIsEditingChange({ isEditing: true });
        }, longPressDelayMs);
    };

    const onInputChange = (nextDraftS3Uri: string) => {
        setDraftS3Uri(nextDraftS3Uri);

        const parsed = tryParsePrefix({
            s3Uri: nextDraftS3Uri.trim(),
            delimiter: normalizedPrefix.delimiter
        });

        if (!parsed) {
            return;
        }

        onS3UriPrefixChange({ s3UriPrefix: parsed });
    };

    const selectHint = (hint: S3UriBarProps["hints"][number]) => {
        const source = draftS3Uri.startsWith("s3://") ? draftS3Uri : canonicalS3Uri;
        const sourcePrefix =
            tryParsePrefix({
                s3Uri: source,
                delimiter: normalizedPrefix.delimiter
            }) ?? normalizedPrefix;

        const nextPrefix: S3Uri.Prefix =
            hint.type === "key-segment"
                ? {
                      type: "prefix",
                      bucket: sourcePrefix.bucket,
                      delimiter: sourcePrefix.delimiter,
                      keySegments: [...sourcePrefix.keySegments, hint.name],
                      isDelimiterTerminated: true
                  }
                : {
                      type: "prefix",
                      bucket: sourcePrefix.bucket,
                      delimiter: sourcePrefix.delimiter,
                      keySegments: [...sourcePrefix.keySegments],
                      isDelimiterTerminated: false,
                      nextKeySegmentPrefix: hint.name
                  };

        const nextDraftS3Uri = stringifyS3Uri(nextPrefix);

        setDraftS3Uri(nextDraftS3Uri);

        const parsed = tryParsePrefix({
            s3Uri: nextDraftS3Uri,
            delimiter: normalizedPrefix.delimiter
        });

        if (!parsed) {
            return;
        }

        onS3UriPrefixChange({ s3UriPrefix: parsed });
    };

    const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            ignoreNextBlurRef.current = true;
            onIsEditingChange({ isEditing: false });
            return;
        }

        if (hints.length > 0 && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveHintIndex(index => {
                if (index < 0) {
                    return 0;
                }

                return (index + 1) % hints.length;
            });
            return;
        }

        if (hints.length > 0 && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveHintIndex(index => {
                if (index < 0) {
                    return hints.length - 1;
                }

                return (index - 1 + hints.length) % hints.length;
            });
            return;
        }

        if (event.key === "Enter" && activeHintIndex >= 0) {
            event.preventDefault();

            const activeHint = hints[activeHintIndex];

            if (!activeHint) {
                return;
            }

            selectHint(activeHint);
        }
    };

    const onBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (isEditing || event.button !== 0) {
            return;
        }

        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.closest("[data-s3-uri-segment='true']")) {
            return;
        }

        if (target.closest("[data-s3-uri-ignore-edit='true']")) {
            return;
        }

        lastEnterEditRequestTimeRef.current = performance.now();
        onIsEditingChange({ isEditing: true });
    };

    const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!isEditing) {
            return;
        }

        if (ignoreNextBlurRef.current) {
            ignoreNextBlurRef.current = false;
            return;
        }

        const nextFocusedElement = event.relatedTarget;

        if (
            nextFocusedElement instanceof Node &&
            event.currentTarget.contains(nextFocusedElement)
        ) {
            return;
        }

        if (
            nextFocusedElement === null &&
            performance.now() - lastEnterEditRequestTimeRef.current < 250
        ) {
            return;
        }

        onIsEditingChange({ isEditing: false });
    };

    const displayLeadingCrumbs = displayCrumbs.slice(
        0,
        Math.min(2, displayCrumbs.length)
    );
    const displayKeyCrumbs = displayCrumbs.slice(2);

    return (
        <div className={cx(classes.root, className)} ref={rootRef} onBlur={onRootBlur}>
            <div className={classes.bar} onPointerDown={onBarPointerDown}>
                {isEditing ? (
                    <div className={classes.inputWrapper}>
                        <label htmlFor={inputId} className={classes.srOnly}>
                            S3 URI
                        </label>
                        <input
                            id={inputId}
                            ref={inputRef}
                            className={classes.input}
                            type="text"
                            value={draftS3Uri}
                            onChange={event => onInputChange(event.target.value)}
                            onKeyDown={onInputKeyDown}
                            autoComplete="off"
                            spellCheck={false}
                            aria-autocomplete={hints.length > 0 ? "list" : undefined}
                            aria-controls={hints.length > 0 ? hintsListId : undefined}
                            aria-expanded={hints.length > 0}
                            aria-activedescendant={
                                activeHintIndex >= 0
                                    ? `${hintsListId}-${activeHintIndex}`
                                    : undefined
                            }
                        />
                    </div>
                ) : (
                    <nav
                        className={classes.pathDisplay}
                        aria-label="S3 URI"
                        ref={pathDisplayRef}
                    >
                        <div className={classes.crumbs}>
                            {displayLeadingCrumbs.map((crumb, index) => (
                                <Fragment key={`${crumb.label}-${index}`}>
                                    <span className={classes.crumbItem}>
                                        {crumb.kind === "ellipsis" ? (
                                            <span className={classes.ellipsis}>...</span>
                                        ) : (
                                            <button
                                                type="button"
                                                className={cx(
                                                    classes.segmentButton,
                                                    crumb.kind === "root" &&
                                                        classes.segmentRoot,
                                                    crumb.kind === "bucket" &&
                                                        classes.segmentBucket,
                                                    crumb.kind === "segment" &&
                                                        classes.segmentPrefix,
                                                    crumb.isCurrent &&
                                                        classes.segmentCurrent
                                                )}
                                                data-s3-uri-segment="true"
                                                onPointerDown={event => {
                                                    if (event.button !== 0) {
                                                        return;
                                                    }

                                                    event.stopPropagation();
                                                    startLongPressTimer();
                                                }}
                                                onPointerUp={() => {
                                                    clearLongPressTimeout();
                                                }}
                                                onPointerLeave={() => {
                                                    clearLongPressTimeout();
                                                }}
                                                onPointerCancel={() => {
                                                    clearLongPressTimeout();
                                                }}
                                                onClick={event => {
                                                    event.stopPropagation();

                                                    if (longPressTriggeredRef.current) {
                                                        longPressTriggeredRef.current =
                                                            false;
                                                        return;
                                                    }

                                                    onS3UriPrefixChange({
                                                        s3UriPrefix: crumb.s3UriPrefix
                                                    });
                                                }}
                                                aria-label={`Go to ${stringifyS3Uri(
                                                    crumb.s3UriPrefix
                                                )}`}
                                            >
                                                {crumb.kind === "bucket" && (
                                                    <span
                                                        className={cx(
                                                            classes.segmentGroupTag,
                                                            classes.segmentGroupTagBucket
                                                        )}
                                                        aria-hidden="true"
                                                    >
                                                        <Icon
                                                            size="extra small"
                                                            icon={s3UriBucketSvgUrl}
                                                        />
                                                    </span>
                                                )}
                                                {crumb.kind === "root" ? (
                                                    <span
                                                        className={classes.rootIcon}
                                                        aria-hidden="true"
                                                    >
                                                        <Icon
                                                            size="small"
                                                            className={
                                                                classes.rootIconGlyph
                                                            }
                                                            icon={s3UriHomeSvgUrl}
                                                        />
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={classes.segmentLabel}
                                                    >
                                                        {crumb.label}
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </span>
                                    {shouldShowSeparatorAtIndex(
                                        displayLeadingCrumbs,
                                        index,
                                        normalizedPrefix.delimiter
                                    ) && (
                                        <span className={classes.separator}>
                                            {getSeparatorTokenBetweenKinds({
                                                leftKind: crumb.kind,
                                                rightKind:
                                                    displayLeadingCrumbs[index + 1].kind,
                                                delimiter: normalizedPrefix.delimiter
                                            })}
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                            {displayKeyCrumbs.length > 0 && (
                                <span className={classes.keyGroup}>
                                    <span
                                        className={cx(
                                            classes.segmentGroupTag,
                                            classes.segmentGroupTagKey
                                        )}
                                        aria-label="Object key"
                                    >
                                        <Icon
                                            size="extra small"
                                            icon={getIconUrlByName("Key")}
                                        />
                                    </span>
                                    {displayKeyCrumbs.map((crumb, keyIndex) => {
                                        const absoluteIndex = keyIndex + 2;

                                        return (
                                            <Fragment
                                                key={`${crumb.label}-${absoluteIndex}`}
                                            >
                                                <span className={classes.crumbItem}>
                                                    {crumb.kind === "ellipsis" ? (
                                                        <span
                                                            className={classes.ellipsis}
                                                        >
                                                            ...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={cx(
                                                                classes.segmentButton,
                                                                keyIndex === 0 &&
                                                                    classes.segmentKeyFirst,
                                                                crumb.isCurrent &&
                                                                    crumb.kind !==
                                                                        "segment" &&
                                                                    classes.segmentCurrent
                                                            )}
                                                            data-s3-uri-segment="true"
                                                            onPointerDown={event => {
                                                                if (event.button !== 0) {
                                                                    return;
                                                                }

                                                                event.stopPropagation();
                                                                startLongPressTimer();
                                                            }}
                                                            onPointerUp={() => {
                                                                clearLongPressTimeout();
                                                            }}
                                                            onPointerLeave={() => {
                                                                clearLongPressTimeout();
                                                            }}
                                                            onPointerCancel={() => {
                                                                clearLongPressTimeout();
                                                            }}
                                                            onClick={event => {
                                                                event.stopPropagation();

                                                                if (
                                                                    longPressTriggeredRef.current
                                                                ) {
                                                                    longPressTriggeredRef.current =
                                                                        false;
                                                                    return;
                                                                }

                                                                onS3UriPrefixChange({
                                                                    s3UriPrefix:
                                                                        crumb.s3UriPrefix
                                                                });
                                                            }}
                                                            aria-label={`Go to ${stringifyS3Uri(
                                                                crumb.s3UriPrefix
                                                            )}`}
                                                        >
                                                            <span
                                                                className={
                                                                    classes.segmentLabel
                                                                }
                                                            >
                                                                {crumb.label}
                                                            </span>
                                                        </button>
                                                    )}
                                                </span>
                                                {shouldShowSeparatorAtIndex(
                                                    displayCrumbs,
                                                    absoluteIndex,
                                                    normalizedPrefix.delimiter
                                                ) && (
                                                    <span className={classes.separator}>
                                                        {getSeparatorTokenBetweenKinds({
                                                            leftKind: crumb.kind,
                                                            rightKind:
                                                                displayCrumbs[
                                                                    absoluteIndex + 1
                                                                ].kind,
                                                            delimiter:
                                                                normalizedPrefix.delimiter
                                                        })}
                                                    </span>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                    {trailingSeparatorToken && (
                                        <span className={classes.separator}>
                                            {trailingSeparatorToken}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        <div className={classes.measure} aria-hidden="true">
                            <div className={classes.crumbs}>
                                {crumbs.map((crumb, index) => (
                                    <Fragment key={`${crumb.label}-${index}`}>
                                        <span
                                            className={classes.crumbItem}
                                            ref={el => {
                                                measureCrumbRefs.current[index] = el;
                                            }}
                                        >
                                            {index === 2 && (
                                                <span
                                                    className={cx(
                                                        classes.segmentGroupTag,
                                                        classes.segmentGroupTagKey
                                                    )}
                                                    aria-label="Object key"
                                                >
                                                    <Icon
                                                        size="extra small"
                                                        icon={getIconUrlByName("Key")}
                                                    />
                                                </span>
                                            )}
                                            <span
                                                className={cx(
                                                    classes.segmentButton,
                                                    crumb.kind === "root" &&
                                                        classes.segmentRoot,
                                                    crumb.kind === "bucket" &&
                                                        classes.segmentBucket,
                                                    index === 2 &&
                                                        crumb.kind === "segment" &&
                                                        classes.segmentKeyFirst,
                                                    crumb.isCurrent &&
                                                        crumb.kind !== "segment" &&
                                                        classes.segmentCurrent
                                                )}
                                            >
                                                {crumb.kind === "bucket" && (
                                                    <span
                                                        className={cx(
                                                            classes.segmentGroupTag,
                                                            classes.segmentGroupTagBucket
                                                        )}
                                                        aria-hidden="true"
                                                    >
                                                        <Icon
                                                            size="extra small"
                                                            icon={s3UriBucketSvgUrl}
                                                        />
                                                    </span>
                                                )}
                                                {crumb.kind === "root" ? (
                                                    <span
                                                        className={classes.rootIcon}
                                                        aria-hidden="true"
                                                    >
                                                        <Icon
                                                            size="small"
                                                            className={
                                                                classes.rootIconGlyph
                                                            }
                                                            icon={s3UriHomeSvgUrl}
                                                        />
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={classes.segmentLabel}
                                                    >
                                                        {crumb.label}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                        {shouldShowSeparatorAtIndex(
                                            crumbs,
                                            index,
                                            normalizedPrefix.delimiter
                                        ) && (
                                            <span className={classes.separator}>
                                                {getSeparatorTokenBetweenKinds({
                                                    leftKind: crumb.kind,
                                                    rightKind: crumbs[index + 1].kind,
                                                    delimiter: normalizedPrefix.delimiter
                                                })}
                                            </span>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                            <span
                                ref={measureSlashSeparatorRef}
                                className={classes.separator}
                            >
                                /
                            </span>
                            {normalizedPrefix.delimiter !== "/" && (
                                <span
                                    ref={measureDelimiterSeparatorRef}
                                    className={classes.separator}
                                >
                                    {normalizedPrefix.delimiter}
                                </span>
                            )}
                            <span ref={measureEllipsisRef} className={classes.ellipsis}>
                                ...
                            </span>
                        </div>
                    </nav>
                )}

                {(onToggleBookmark || isBookmarked) && (
                    <div className={classes.trailingActions}>
                        <Tooltip
                            title={
                                onToggleBookmark
                                    ? isBookmarked
                                        ? "Remove bookmark"
                                        : "Bookmark"
                                    : "Bookmarked"
                            }
                        >
                            <div data-s3-uri-ignore-edit="true">
                                <IconButton
                                    aria-label={
                                        onToggleBookmark
                                            ? isBookmarked
                                                ? "Remove bookmark"
                                                : "Add bookmark"
                                            : "Bookmarked"
                                    }
                                    icon={getIconUrlByName(
                                        isBookmarked ? "PushPin" : "PushPinOutlined"
                                    )}
                                    onClick={event => {
                                        event.stopPropagation();
                                        onToggleBookmark?.();
                                    }}
                                    disabled={!onToggleBookmark}
                                    className={cx(
                                        classes.bookmarkButton,
                                        isBookmarked && classes.bookmarkButtonActive,
                                        !onToggleBookmark &&
                                            classes.bookmarkButtonReadonly
                                    )}
                                />
                            </div>
                        </Tooltip>
                    </div>
                )}
            </div>

            {isEditing && hints.length > 0 && (
                <div className={classes.hintsPanel} id={hintsListId} role="listbox">
                    {hints.map((hint, index) => (
                        <button
                            id={`${hintsListId}-${index}`}
                            key={`${hint.type}-${hint.name}-${index}`}
                            type="button"
                            role="option"
                            aria-selected={activeHintIndex === index}
                            className={cx(
                                classes.hintItem,
                                activeHintIndex === index && classes.hintItemActive
                            )}
                            onMouseDown={event => {
                                event.preventDefault();
                            }}
                            onMouseEnter={() => {
                                setActiveHintIndex(index);
                            }}
                            onClick={() => {
                                setActiveHintIndex(index);
                                selectHint(hint);
                            }}
                        >
                            <span className={classes.hintType}>
                                {hint.type === "key-segment" ? "Prefix" : "Object"}
                            </span>
                            <span className={classes.hintName}>{hint.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const useStyles = tss
    .withName({ S3UriBar })
    .withParams<{ isEditing: boolean }>()
    .create(({ theme, isEditing }) => {
        const barHeight = "56px";
        const accentColor = theme.colors.useCases.buttons.actionActive;

        return {
            root: {
                width: "100%",
                position: "relative"
            },
            bar: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(3),
                width: "100%",
                minWidth: 0,
                height: barHeight,
                paddingTop: "6px",
                paddingBottom: "6px",
                paddingLeft: theme.spacing(3),
                paddingRight: theme.spacing(3),
                boxSizing: "border-box",
                borderRadius: "16px",
                border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                boxShadow: isEditing ? `inset 0 -2px 0 ${accentColor}` : undefined,
                "&:hover": {
                    boxShadow: !isEditing ? theme.shadows[6] : undefined
                }
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
                gap: theme.spacing(2)
            },
            keyGroup: {
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1),
                height: "36px",
                paddingLeft: "10px",
                paddingRight: "10px",
                borderRadius: "12px",
                boxSizing: "border-box",
                backgroundColor: theme.colors.useCases.surfaces.background,
                boxShadow: `inset 0 0 0 1px ${theme.colors.useCases.surfaces.surface2}`
            },
            crumbItem: {
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1)
            },
            segmentGroupTag: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "999px",
                whiteSpace: "nowrap"
            },
            segmentGroupTagBucket: {
                color: theme.colors.useCases.typography.textPrimary,
                backgroundColor: "transparent"
            },
            segmentGroupTagKey: {
                color: theme.colors.useCases.typography.textPrimary,
                backgroundColor: theme.colors.useCases.surfaces.background
            },
            separator: {
                margin: `0 ${theme.spacing(2)}`,
                color: theme.colors.useCases.typography.textSecondary
            },
            segmentButton: {
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1),
                height: "36px",
                paddingTop: "6px",
                paddingBottom: "6px",
                paddingLeft: "10px",
                paddingRight: "10px",
                margin: 0,
                border: "1px solid transparent",
                borderRadius: "12px",
                boxSizing: "border-box",
                backgroundColor: "transparent",
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
                textDecoration: "none",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                }
            },
            segmentRoot: {
                fontWeight: 600,
                borderColor: theme.colors.useCases.surfaces.surface2,
                backgroundColor: theme.colors.useCases.surfaces.background
            },
            segmentBucket: {
                fontWeight: 700,
                borderColor: theme.colors.useCases.surfaces.surface2,
                backgroundColor: theme.colors.useCases.surfaces.background
            },
            segmentPrefix: {
                borderColor: theme.colors.useCases.surfaces.surface2,
                backgroundColor: theme.colors.useCases.surfaces.background
            },
            segmentCurrent: {
                fontWeight: 700
            },
            segmentKeyFirst: {
                paddingLeft: "6px"
            },
            segmentLabel: {
                display: "inline-block"
            },
            rootIcon: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
            },
            rootIconGlyph: {
                fontSize: "18px"
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
            trailingActions: {
                display: "flex",
                alignItems: "center",
                flexShrink: 0
            },
            bookmarkButton: {
                borderRadius: "10px",
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: 0,
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface1
                }
            },
            bookmarkButtonActive: {
                "& .MuiSvgIcon-root, & img": {
                    color: accentColor
                }
            },
            bookmarkButtonReadonly: {
                opacity: 0.65
            },
            hintsPanel: {
                position: "absolute",
                left: 0,
                right: 0,
                top: `calc(${barHeight} + ${theme.spacing(2)})`,
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                padding: theme.spacing(2),
                borderRadius: "14px",
                border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                boxShadow: theme.shadows[6]
            },
            hintItem: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(3),
                width: "100%",
                border: "none",
                borderRadius: "10px",
                background: "transparent",
                color: "inherit",
                textAlign: "left",
                padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
                cursor: "pointer"
            },
            hintItemActive: {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            hintType: {
                fontSize: "0.78rem",
                fontWeight: 600,
                color: theme.colors.useCases.typography.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                flexShrink: 0
            },
            hintName: {
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.colors.useCases.typography.textPrimary
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
            }
        };
    });
