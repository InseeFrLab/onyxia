import {
    Fragment,
    useCallback,
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
import LinearProgress from "@mui/material/LinearProgress";
import { getIconUrlByName } from "lazy-icons";
import { useDomRect } from "powerhooks/useDomRect";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import s3UriBucketSvgUrl from "ui/assets/svg/S3UriBucket.svg";
import s3UriHomeSvgUrl from "ui/assets/svg/S3UriHome.svg";
import { assert } from "tsafe";

export type S3UriBarProps = {
    className?: string;
    s3Uri: S3Uri | undefined;
    onS3UriPrefixChange: (params: {
        s3Uri: S3Uri | undefined;
        isHintSelection: boolean;
    }) => void;
    hints: {
        type: "object" | "key-segment" | "bookmark";
        text: string;
        s3Uri: S3Uri;
    }[];
    areHintsLoading: boolean;
    isBookmarked: boolean;
    onToggleBookmark?: (props: { s3Uri: S3Uri }) => void;
};

type NavigationCrumb = {
    label: string;
    kind: "root" | "bucket" | "segment";
    s3Uri: S3Uri;
    isCurrent: boolean;
};

type DisplayCrumb =
    | NavigationCrumb
    | {
          label: "...";
          kind: "ellipsis";
      };

const longPressDelayMs = 200;
const hintsPanelHorizontalEdgePaddingPx = 8;
const hintsPanelVerticalOffsetPx = 6;
const hintsPanelFallbackWidthPx = 280;
const defaultDraftS3Uri = "s3://";
type CrumbKind = DisplayCrumb["kind"];
type HintType = S3UriBarProps["hints"][number]["type"];
type DisplayedHint =
    | (S3UriBarProps["hints"][number] & {
          action: "select-hint";
      })
    | {
          type: "key-segment";
          text: ".";
          action: "exit-edit-mode";
      };
const hintMiddleEllipsisMaxLength = 58;
const hintMiddleEllipsisHeadLength = 34;
const hintMiddleEllipsisTailLength = 20;

function collapseMiddle(text: string): string {
    if (text.length <= hintMiddleEllipsisMaxLength) {
        return text;
    }

    return `${text.slice(0, hintMiddleEllipsisHeadLength)}...${text.slice(
        -hintMiddleEllipsisTailLength
    )}`;
}

function getHintTypeLabel(type: HintType): string {
    switch (type) {
        case "key-segment":
            return "Prefix";
        case "bookmark":
            return "Bookmark";
        case "object":
            return "Object";
    }
}

function getHintTypeIcon(type: HintType): string {
    switch (type) {
        case "key-segment":
            return getIconUrlByName("Folder");
        case "bookmark":
            return getIconUrlByName("Link");
        case "object":
            return getIconUrlByName("Description");
    }
}

function getIsCursorAtEnd(input: HTMLInputElement): boolean {
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? input.value.length;

    return selectionStart === input.value.length && selectionEnd === input.value.length;
}

function getDisplayedHints(params: {
    draftS3Uri: string;
    hints: S3UriBarProps["hints"];
    s3Uri: S3Uri | undefined;
}): DisplayedHint[] {
    const { draftS3Uri, hints, s3Uri } = params;

    const displayedHints = hints.map<DisplayedHint>(hint => ({
        ...hint,
        action: "select-hint"
    }));

    if (s3Uri === undefined) {
        const normalizedDraft = draftS3Uri.trim().toLocaleLowerCase();

        return displayedHints.filter(
            hint =>
                hint.type === "bookmark" &&
                hint.text.toLocaleLowerCase().startsWith(normalizedDraft)
        );
    }

    if (!s3Uri.isDelimiterTerminated) {
        return displayedHints;
    }

    return [
        {
            type: "key-segment",
            text: ".",
            action: "exit-edit-mode"
        },
        ...displayedHints
    ];
}

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

function getTrailingSeparatorToken(s3Uri: S3Uri): string | undefined {
    if (!s3Uri.isDelimiterTerminated) {
        return undefined;
    }

    if (s3Uri.keySegments.length === 0) {
        return "/";
    }

    return s3Uri.delimiter;
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

function getBucketRootPrefix(params: { bucket: string; delimiter: string }): S3Uri {
    const { bucket, delimiter } = params;

    return {
        bucket,
        delimiter,
        keySegments: [],
        isDelimiterTerminated: true
    };
}

function tryParseS3Uri(params: { s3Uri: string; delimiter: string }): S3Uri | undefined {
    const { s3Uri, delimiter } = params;

    try {
        return parseS3Uri({
            value: s3Uri,
            delimiter
        });
    } catch {
        return undefined;
    }
}

function getCanonicalS3UriValue(s3Uri: S3Uri | undefined): string {
    return s3Uri === undefined ? defaultDraftS3Uri : stringifyS3Uri(s3Uri);
}

function getBreadcrumbs(params: { s3Uri: S3Uri }): NavigationCrumb[] {
    const { s3Uri } = params;
    const { bucket, delimiter } = s3Uri;
    const bucketRootS3Uri = getBucketRootPrefix({ bucket, delimiter });

    const segmentLabels = s3Uri.keySegments;

    const crumbs: NavigationCrumb[] = [
        {
            label: "s3://",
            kind: "root",
            s3Uri: bucketRootS3Uri,
            isCurrent: false
        },
        {
            label: bucket,
            kind: "bucket",
            s3Uri: bucketRootS3Uri,
            isCurrent: segmentLabels.length === 0
        }
    ];

    segmentLabels.forEach((segmentLabel, index) => {
        const isLast = index === segmentLabels.length - 1;

        const segmentS3Uri: S3Uri = {
            bucket,
            delimiter,
            keySegments: segmentLabels.slice(0, index + 1),
            isDelimiterTerminated: isLast ? s3Uri.isDelimiterTerminated : true
        };

        crumbs.push({
            label: segmentLabel,
            kind: "segment",
            s3Uri: segmentS3Uri,
            isCurrent: isLast
        });
    });

    return crumbs;
}

export function S3UriBar(props: S3UriBarProps) {
    const {
        className,
        s3Uri,
        onS3UriPrefixChange,
        hints,
        areHintsLoading,
        isBookmarked,
        onToggleBookmark
    } = props;

    const normalizedS3Uri = useMemo<S3Uri>(() => {
        if (s3Uri !== undefined) {
            return s3Uri;
        }

        return {
            bucket: "",
            delimiter: "/",
            keySegments: [],
            isDelimiterTerminated: true
        };
    }, [s3Uri]);
    const isUndefinedPrefixMode = s3Uri === undefined;
    const canonicalS3Uri = useMemo(() => getCanonicalS3UriValue(s3Uri), [s3Uri]);
    const crumbs = useMemo(
        () => (isUndefinedPrefixMode ? [] : getBreadcrumbs({ s3Uri: normalizedS3Uri })),
        [isUndefinedPrefixMode, normalizedS3Uri]
    );
    const trailingSeparatorToken = isUndefinedPrefixMode
        ? undefined
        : getTrailingSeparatorToken(normalizedS3Uri);

    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hintsPanelRef = useRef<HTMLDivElement>(null);
    const textMeasureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const longPressTimeoutRef = useRef<number | undefined>(undefined);
    const longPressTriggeredRef = useRef(false);
    const wasEditingRef = useRef(false);
    const wasUndefinedPrefixModeRef = useRef(isUndefinedPrefixMode);
    const shouldFocusInputOnNextEditRef = useRef(false);
    const ignoreNextBlurRef = useRef(false);
    const preserveNextDraftResetRef = useRef(false);
    const lastRequestedCanonicalS3UriRef = useRef(canonicalS3Uri);
    const pendingInputSelectionRef = useRef<
        | {
              start: number;
              end: number;
          }
        | undefined
    >(undefined);
    const lastEnterEditRequestTimeRef = useRef(Number.NEGATIVE_INFINITY);

    const measureCrumbRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const measureSlashSeparatorRef = useRef<HTMLSpanElement | null>(null);
    const measureDelimiterSeparatorRef = useRef<HTMLSpanElement | null>(null);
    const measureEllipsisRef = useRef<HTMLSpanElement | null>(null);
    const { domRect: pathDisplayRect, ref: pathDisplayRef } = useDomRect();

    const [draftS3Uri, setDraftS3Uri] = useState(canonicalS3Uri);
    const [isEditing, setIsEditing] = useState(isUndefinedPrefixMode);
    const [isFocusedWithin, setIsFocusedWithin] = useState(false);
    const [isCursorAtEnd, setIsCursorAtEnd] = useState(true);
    const [displayCrumbs, setDisplayCrumbs] = useState<DisplayCrumb[]>(crumbs);
    const [activeHintIndex, setActiveHintIndex] = useState(-1);
    const [isBookmarkHovered, setIsBookmarkHovered] = useState(false);
    const [hintsPanelPosition, setHintsPanelPosition] = useState({
        left: hintsPanelHorizontalEdgePaddingPx,
        top: 0
    });

    const inputId = useId();
    const hintsPanelId = useId();
    const hintsListId = useId();

    const displayedHints = useMemo(
        () =>
            getDisplayedHints({
                draftS3Uri,
                hints,
                s3Uri
            }),
        [draftS3Uri, hints, s3Uri]
    );
    const isHintsPanelVisible =
        isEditing &&
        isFocusedWithin &&
        isCursorAtEnd &&
        (displayedHints.length > 0 || areHintsLoading);
    const areHintsInteractive = isHintsPanelVisible && displayedHints.length > 0;

    const { classes, cx } = useStyles({ isEditing });

    const syncInputCursorState = useCallback(
        (input: HTMLInputElement | null = inputRef.current) => {
            if (!input) {
                return;
            }

            const nextIsCursorAtEnd = getIsCursorAtEnd(input);

            setIsCursorAtEnd(previous =>
                previous === nextIsCursorAtEnd ? previous : nextIsCursorAtEnd
            );
        },
        []
    );

    const updateHintsPanelPosition = useCallback(() => {
        const input = inputRef.current;
        const root = rootRef.current;

        if (!input || !root) {
            return;
        }

        syncInputCursorState(input);

        const rootRect = root.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(input);
        const selectionStart = input.selectionStart ?? input.value.length;
        const textBeforeCursor = input.value.slice(0, selectionStart);

        if (textMeasureCanvasRef.current === null) {
            textMeasureCanvasRef.current = document.createElement("canvas");
        }

        const context = textMeasureCanvasRef.current.getContext("2d");

        if (!context) {
            return;
        }

        context.font = computedStyle.font;

        const measuredTextWidth = context.measureText(textBeforeCursor).width;
        const letterSpacingValue = Number.parseFloat(computedStyle.letterSpacing);
        const letterSpacingPx = Number.isFinite(letterSpacingValue)
            ? letterSpacingValue
            : 0;
        const letterSpacingWidth =
            textBeforeCursor.length > 0
                ? (textBeforeCursor.length - 1) * letterSpacingPx
                : 0;
        const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
        const cursorLeft =
            inputRect.left -
            rootRect.left +
            paddingLeft +
            measuredTextWidth +
            letterSpacingWidth -
            input.scrollLeft;

        const panelWidth =
            hintsPanelRef.current?.getBoundingClientRect().width ??
            hintsPanelFallbackWidthPx;
        const minLeft = hintsPanelHorizontalEdgePaddingPx;
        const maxLeft = Math.max(
            minLeft,
            rootRect.width - panelWidth - hintsPanelHorizontalEdgePaddingPx
        );
        const nextLeft = Math.min(Math.max(cursorLeft, minLeft), maxLeft);
        const nextTop = inputRect.bottom - rootRect.top + hintsPanelVerticalOffsetPx;

        setHintsPanelPosition(previous =>
            previous.left === nextLeft && previous.top === nextTop
                ? previous
                : { left: nextLeft, top: nextTop }
        );
    }, [syncInputCursorState]);

    useEffect(() => {
        if (isUndefinedPrefixMode && !isEditing) {
            setIsEditing(true);
        }
    }, [isEditing, isUndefinedPrefixMode]);

    useEffect(() => {
        if (!isBookmarked) {
            setIsBookmarkHovered(false);
        }
    }, [isBookmarked]);

    useEffect(() => {
        const didExitUndefinedPrefixMode =
            wasUndefinedPrefixModeRef.current && !isUndefinedPrefixMode;

        wasUndefinedPrefixModeRef.current = isUndefinedPrefixMode;

        if (!didExitUndefinedPrefixMode || !isEditing) {
            return;
        }

        if (inputRef.current === document.activeElement) {
            return;
        }

        setIsEditing(false);
    }, [isEditing, isUndefinedPrefixMode]);

    useEffect(() => {
        if (!isEditing) {
            shouldFocusInputOnNextEditRef.current = false;
            ignoreNextBlurRef.current = false;
            lastEnterEditRequestTimeRef.current = Number.NEGATIVE_INFINITY;
        }

        if (preserveNextDraftResetRef.current) {
            preserveNextDraftResetRef.current = false;
        } else {
            const shouldSyncDraft =
                !isEditing ||
                !wasEditingRef.current ||
                lastRequestedCanonicalS3UriRef.current !== canonicalS3Uri;

            if (shouldSyncDraft) {
                setDraftS3Uri(canonicalS3Uri);
            }
        }

        wasEditingRef.current = isEditing;
        lastRequestedCanonicalS3UriRef.current = canonicalS3Uri;
    }, [canonicalS3Uri, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setActiveHintIndex(-1);
            return;
        }

        if (displayedHints.length === 0) {
            setActiveHintIndex(-1);
            return;
        }

        setActiveHintIndex(index =>
            index >= displayedHints.length
                ? displayedHints.length - 1
                : Math.max(index, 0)
        );
    }, [displayedHints.length, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            const input = inputRef.current;

            if (!input) {
                return;
            }

            if (shouldFocusInputOnNextEditRef.current) {
                input.focus();
            }

            shouldFocusInputOnNextEditRef.current = false;
            const selection = pendingInputSelectionRef.current;
            pendingInputSelectionRef.current = undefined;

            if (input === document.activeElement && selection !== undefined) {
                input.setSelectionRange(
                    Math.min(selection.start, input.value.length),
                    Math.min(selection.end, input.value.length)
                );
            } else if (input === document.activeElement) {
                const cursorPosition = input.value.length;
                input.setSelectionRange(cursorPosition, cursorPosition);
            }

            syncInputCursorState(input);
            updateHintsPanelPosition();
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [isEditing, syncInputCursorState, updateHintsPanelPosition]);

    useEffect(() => {
        if (!isHintsPanelVisible) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            updateHintsPanelPosition();
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [
        activeHintIndex,
        areHintsLoading,
        draftS3Uri,
        displayedHints.length,
        isHintsPanelVisible,
        updateHintsPanelPosition
    ]);

    useEffect(() => {
        if (!isEditing || activeHintIndex < 0) {
            return;
        }

        const activeHintElement = document.getElementById(
            `${hintsListId}-${activeHintIndex}`
        );

        if (!(activeHintElement instanceof HTMLElement)) {
            return;
        }

        activeHintElement.scrollIntoView({
            block: "nearest"
        });
    }, [activeHintIndex, hintsListId, isEditing]);

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
            normalizedS3Uri.delimiter === "/"
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
        const separatorCount = getSeparatorCount(crumbs, normalizedS3Uri.delimiter);
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
                    delimiter: normalizedS3Uri.delimiter,
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
        normalizedS3Uri.delimiter,
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
            shouldFocusInputOnNextEditRef.current = true;
            setIsEditing(true);
        }, longPressDelayMs);
    };

    const emitS3UriChange = (params: {
        s3Uri: S3Uri | undefined;
        isHintSelection: boolean;
    }) => {
        lastRequestedCanonicalS3UriRef.current = getCanonicalS3UriValue(params.s3Uri);
        onS3UriPrefixChange(params);
    };

    const emitDraftS3Uri = (params: {
        nextDraftS3Uri: string;
        isHintSelection: boolean;
    }) => {
        const { nextDraftS3Uri, isHintSelection } = params;

        emitS3UriChange({
            s3Uri: tryParseS3Uri({
                s3Uri: nextDraftS3Uri.trim(),
                delimiter: normalizedS3Uri.delimiter
            }),
            isHintSelection
        });
    };

    const onInputChange = (nextDraftS3Uri: string) => {
        setDraftS3Uri(nextDraftS3Uri);
        emitDraftS3Uri({
            nextDraftS3Uri,
            isHintSelection: false
        });
    };

    const tryCommitDraftS3Uri = () => {
        emitDraftS3Uri({
            nextDraftS3Uri: draftS3Uri,
            isHintSelection: false
        });
    };

    const exitEditing = () => {
        if (isUndefinedPrefixMode) {
            return;
        }

        ignoreNextBlurRef.current = true;
        setIsEditing(false);
    };

    const enterRootEditing = () => {
        preserveNextDraftResetRef.current = true;
        lastEnterEditRequestTimeRef.current = performance.now();
        shouldFocusInputOnNextEditRef.current = true;
        setDraftS3Uri(defaultDraftS3Uri);
        setIsEditing(true);
        emitS3UriChange({
            s3Uri: undefined,
            isHintSelection: false
        });
    };

    const enterKeyEditing = () => {
        const keyStartIndex = `s3://${normalizedS3Uri.bucket}/`.length;

        pendingInputSelectionRef.current = {
            start: keyStartIndex,
            end: canonicalS3Uri.length
        };
        lastEnterEditRequestTimeRef.current = performance.now();
        shouldFocusInputOnNextEditRef.current = true;
        setIsEditing(true);
    };

    const blurInput = () => {
        lastEnterEditRequestTimeRef.current = Number.NEGATIVE_INFINITY;
        inputRef.current?.blur();
    };

    const selectHint = (hint: (typeof displayedHints)[number]) => {
        if (hint.action === "exit-edit-mode") {
            exitEditing();
            return;
        }

        const nextDraftS3Uri = stringifyS3Uri(hint.s3Uri);

        setDraftS3Uri(nextDraftS3Uri);
        emitS3UriChange({
            s3Uri: hint.s3Uri,
            isHintSelection: true
        });
    };

    const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();

            if (isHintsPanelVisible) {
                blurInput();
                return;
            }

            if (isUndefinedPrefixMode) {
                return;
            }

            exitEditing();
            return;
        }

        if (areHintsInteractive && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveHintIndex(index => {
                if (index < 0) {
                    return 0;
                }

                return (index + 1) % displayedHints.length;
            });
            return;
        }

        if (areHintsInteractive && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveHintIndex(index => {
                if (index < 0) {
                    return displayedHints.length - 1;
                }

                return (index - 1 + displayedHints.length) % displayedHints.length;
            });
            return;
        }

        if (
            (event.key === "Enter" || event.key === "Tab") &&
            areHintsInteractive &&
            activeHintIndex >= 0
        ) {
            event.preventDefault();

            const activeHint = displayedHints[activeHintIndex];

            if (!activeHint) {
                return;
            }

            selectHint(activeHint);
            return;
        }

        if (event.key === "Enter" && !isUndefinedPrefixMode) {
            event.preventDefault();

            if (!isHintsPanelVisible || displayedHints.length === 0) {
                exitEditing();
            }

            return;
        }

        if (event.key === "Enter" && isUndefinedPrefixMode) {
            event.preventDefault();
            tryCommitDraftS3Uri();
        }
    };

    const onBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (isEditing || event.button !== 0) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        if (target.closest("[data-s3-uri-segment='true']")) {
            return;
        }

        if (target.closest("[data-s3-uri-ignore-edit='true']")) {
            return;
        }

        lastEnterEditRequestTimeRef.current = performance.now();
        shouldFocusInputOnNextEditRef.current = true;
        setIsEditing(true);
    };

    const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!isEditing) {
            return;
        }

        const nextFocusedElement = event.relatedTarget;

        if (
            nextFocusedElement instanceof Node &&
            event.currentTarget.contains(nextFocusedElement)
        ) {
            return;
        }

        setIsFocusedWithin(false);

        if (ignoreNextBlurRef.current) {
            ignoreNextBlurRef.current = false;
            return;
        }

        if (
            nextFocusedElement === null &&
            performance.now() - lastEnterEditRequestTimeRef.current < 250
        ) {
            return;
        }

        if (isUndefinedPrefixMode) {
            tryCommitDraftS3Uri();
            return;
        }

        setIsEditing(false);
    };

    const displayLeadingCrumbs = displayCrumbs.slice(
        0,
        Math.min(2, displayCrumbs.length)
    );
    const displayKeyCrumbs = displayCrumbs.slice(2);
    const shouldShowUnpinnedIcon =
        isBookmarked && isBookmarkHovered && onToggleBookmark !== undefined;
    const bookmarkIconName = shouldShowUnpinnedIcon
        ? "PushPinOutlined"
        : isBookmarked
          ? "PushPin"
          : "PushPinOutlined";

    return (
        <div
            className={cx(classes.root, className)}
            ref={rootRef}
            onFocus={() => {
                setIsFocusedWithin(true);
            }}
            onBlur={onRootBlur}
        >
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
                            onChange={event => {
                                syncInputCursorState(event.target);
                                onInputChange(event.target.value);
                            }}
                            onKeyDown={onInputKeyDown}
                            onKeyUp={event => {
                                syncInputCursorState(event.currentTarget);
                                updateHintsPanelPosition();
                            }}
                            onSelect={event => {
                                syncInputCursorState(event.currentTarget);
                                updateHintsPanelPosition();
                            }}
                            onClick={event => {
                                syncInputCursorState(event.currentTarget);
                                updateHintsPanelPosition();
                            }}
                            autoComplete="off"
                            spellCheck={false}
                            aria-autocomplete={isHintsPanelVisible ? "list" : undefined}
                            aria-controls={isHintsPanelVisible ? hintsPanelId : undefined}
                            aria-expanded={isHintsPanelVisible}
                            aria-busy={areHintsLoading || undefined}
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

                                                    if (crumb.kind === "root") {
                                                        enterRootEditing();
                                                        return;
                                                    }

                                                    emitS3UriChange({
                                                        s3Uri: crumb.s3Uri,
                                                        isHintSelection: false
                                                    });
                                                }}
                                                aria-label={
                                                    crumb.kind === "root"
                                                        ? "Edit from S3 root"
                                                        : `Go to ${stringifyS3Uri(
                                                              crumb.s3Uri
                                                          )}`
                                                }
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
                                        normalizedS3Uri.delimiter
                                    ) && (
                                        <span className={classes.separator}>
                                            {getSeparatorTokenBetweenKinds({
                                                leftKind: crumb.kind,
                                                rightKind:
                                                    displayLeadingCrumbs[index + 1].kind,
                                                delimiter: normalizedS3Uri.delimiter
                                            })}
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                            {displayKeyCrumbs.length > 0 && (
                                <span className={classes.keyGroup}>
                                    <button
                                        type="button"
                                        className={cx(
                                            classes.segmentGroupTag,
                                            classes.segmentGroupTagKey,
                                            classes.keyEditButton
                                        )}
                                        data-s3-uri-ignore-edit="true"
                                        aria-label="Edit object key"
                                        onClick={event => {
                                            event.stopPropagation();
                                            enterKeyEditing();
                                        }}
                                    >
                                        <Icon
                                            size="extra small"
                                            icon={getIconUrlByName("Key")}
                                        />
                                    </button>
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

                                                                emitS3UriChange({
                                                                    s3Uri: crumb.s3Uri,
                                                                    isHintSelection: false
                                                                });
                                                            }}
                                                            aria-label={`Go to ${stringifyS3Uri(
                                                                crumb.s3Uri
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
                                                    normalizedS3Uri.delimiter
                                                ) && (
                                                    <span className={classes.separator}>
                                                        {getSeparatorTokenBetweenKinds({
                                                            leftKind: crumb.kind,
                                                            rightKind:
                                                                displayCrumbs[
                                                                    absoluteIndex + 1
                                                                ].kind,
                                                            delimiter:
                                                                normalizedS3Uri.delimiter
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
                                            normalizedS3Uri.delimiter
                                        ) && (
                                            <span className={classes.separator}>
                                                {getSeparatorTokenBetweenKinds({
                                                    leftKind: crumb.kind,
                                                    rightKind: crumbs[index + 1].kind,
                                                    delimiter: normalizedS3Uri.delimiter
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
                            {normalizedS3Uri.delimiter !== "/" && (
                                <span
                                    ref={measureDelimiterSeparatorRef}
                                    className={classes.separator}
                                >
                                    {normalizedS3Uri.delimiter}
                                </span>
                            )}
                            <span ref={measureEllipsisRef} className={classes.ellipsis}>
                                ...
                            </span>
                        </div>
                    </nav>
                )}

                <div className={classes.trailingActions}>
                    {(onToggleBookmark || isBookmarked) && (
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
                                    icon={getIconUrlByName(bookmarkIconName)}
                                    size="default"
                                    onMouseEnter={() => {
                                        if (
                                            isBookmarked &&
                                            onToggleBookmark !== undefined
                                        ) {
                                            setIsBookmarkHovered(true);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setIsBookmarkHovered(false);
                                    }}
                                    onClick={event => {
                                        event.stopPropagation();
                                        assert(s3Uri !== undefined);
                                        onToggleBookmark?.({ s3Uri });
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
                    )}
                </div>
            </div>

            {isHintsPanelVisible && (
                <div
                    className={classes.hintsPanel}
                    style={{
                        left: hintsPanelPosition.left,
                        top: hintsPanelPosition.top
                    }}
                    ref={hintsPanelRef}
                    id={hintsPanelId}
                    aria-busy={areHintsLoading || undefined}
                >
                    {areHintsLoading && (
                        <>
                            <LinearProgress className={classes.hintsLoadingProgress} />
                            {displayedHints.length === 0 && (
                                <div
                                    className={classes.hintsLoadingState}
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span className={classes.hintsLoadingText}>
                                        Listing...
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                    {displayedHints.length > 0 && (
                        <div
                            id={hintsListId}
                            role="listbox"
                            className={classes.hintsList}
                        >
                            {displayedHints.map((hint, index) => (
                                <button
                                    id={`${hintsListId}-${index}`}
                                    key={`${hint.type}-${hint.text}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={activeHintIndex === index}
                                    className={cx(
                                        classes.hintItem,
                                        activeHintIndex === index &&
                                            classes.hintItemActive
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
                                    <span
                                        className={classes.hintType}
                                        aria-label={getHintTypeLabel(hint.type)}
                                        title={getHintTypeLabel(hint.type)}
                                    >
                                        <Icon
                                            size="extra small"
                                            icon={getHintTypeIcon(hint.type)}
                                        />
                                    </span>
                                    <span className={classes.hintName} title={hint.text}>
                                        {collapseMiddle(hint.text)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const useStyles = tss
    .withName({ S3UriBar })
    .withParams<{ isEditing: boolean }>()
    .create(({ theme, isEditing }) => {
        const barHeight = "auto";
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
                cursor: "text",
                width: "100%",
                minWidth: 0,
                height: barHeight,
                paddingTop: theme.spacing(3),
                paddingBottom: theme.spacing(3),
                paddingLeft: theme.spacing(3),
                paddingRight: theme.spacing(3),
                boxSizing: "border-box",
                borderRadius: "16px",
                border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                boxShadow: isEditing ? `inset 0 -2px 0 ${accentColor}` : undefined,
                "&:hover": {
                    boxShadow: !isEditing ? theme.shadows[4] : undefined
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
                backgroundColor: theme.colors.useCases.surfaces.surface2,
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
                backgroundColor: "transparent"
            },
            keyEditButton: {
                margin: 0,
                border: "none",
                padding: 0,
                boxSizing: "border-box",
                cursor: "pointer",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                }
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
                paddingLeft: "8px",
                paddingRight: "8px",
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
                    backgroundColor: theme.colors.useCases.surfaces.surface3
                }
            },
            segmentRoot: {
                fontWeight: 600,
                borderColor: theme.colors.useCases.surfaces.surface2,
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            segmentBucket: {
                fontWeight: 700,
                borderColor: theme.colors.useCases.surfaces.surface2,
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                paddingRight: "14px"
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
                paddingLeft: "10px",
                font: "inherit",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: theme.colors.useCases.typography.textPrimary
            },
            trailingActions: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                flexShrink: 0
            },
            bookmarkButton: {
                margin: 0,
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "12px",
                backgroundColor: "transparent",
                boxSizing: "border-box",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                },
                "& .MuiSvgIcon-root, & svg, & img": {
                    width: "20px",
                    height: "20px",
                    fontSize: "20px"
                }
            },
            bookmarkButtonActive: {
                backgroundColor: theme.colors.palette.focus.mainAlpha10,
                "&:hover": {
                    backgroundColor: theme.colors.palette.focus.mainAlpha20
                },
                color: accentColor,
                "& .MuiSvgIcon-root, & img, & svg, & path": {
                    color: accentColor,
                    fill: accentColor
                }
            },

            bookmarkButtonReadonly: {
                opacity: 0.65
            },
            hintsPanel: {
                position: "absolute",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                padding: theme.spacing(2),
                width: "fit-content",
                minWidth: "260px",
                maxWidth: "calc(100% - 16px)",
                maxHeight: "260px",
                overflowY: "auto",
                borderRadius: "10px",
                border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                boxShadow: theme.shadows[4]
            },
            hintsList: {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1)
            },
            hintsLoadingProgress: {
                marginBottom: theme.spacing(1),
                borderRadius: 999,
                overflow: "hidden"
            },
            hintsLoadingState: {
                textAlign: "center",
                padding: `0 ${theme.spacing(3)} ${theme.spacing(1)}`
            },
            hintsLoadingText: {
                color: theme.colors.useCases.typography.textSecondary,
                fontSize: theme.typography.rootFontSizePx * 0.95
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                color: theme.colors.useCases.typography.textSecondary,
                backgroundColor: theme.colors.useCases.surfaces.surface2,
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
