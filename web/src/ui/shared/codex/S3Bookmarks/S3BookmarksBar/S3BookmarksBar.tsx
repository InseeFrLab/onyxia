import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { tss } from "tss";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";
import { S3BookmarkItem } from "../S3BookmarksBarItem";
import { useResolveLocalizedString } from "ui/i18n";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";

export type S3BookmarksBarProps = {
    className?: string;
    items: S3BookmarksBarProps.Item[];
    activeItemS3Uri: S3Uri | undefined;
    onDelete: (props: { s3Uri: S3Uri }) => void;
    onRename: (props: { s3Uri: S3Uri; currentDisplayName: string | undefined }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
    showItemIcons?: boolean;
    showLeadingIcon?: boolean;
};

export namespace S3BookmarksBarProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}

const ITEM_GAP = 6;
const PANEL_ROW_GAP = 4;
const MORE_BUTTON_SIZE = 32;
const PANEL_ROW_HEIGHT = 40;

export function S3BookmarksBar(props: S3BookmarksBarProps) {
    const {
        className,
        items,
        activeItemS3Uri,
        getItemLink,
        onDelete,
        onRename,
        showItemIcons = false,
        showLeadingIcon = true
    } = props;

    const { classes, cx } = useStyles();

    const rowRef = useRef<HTMLDivElement | null>(null);
    const leadingIconRef = useRef<HTMLSpanElement | null>(null);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const itemWidths = useRef<Map<string, number>>(new Map());
    const [visibleCount, setVisibleCount] = useState(items.length);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const activeItemKey = activeItemS3Uri ? stringifyS3Uri(activeItemS3Uri) : undefined;

    const { resolveLocalizedString } = useResolveLocalizedString();
    const userItems = useMemo(() => items.filter(item => !item.isReadonly), [items]);
    const adminItems = useMemo(() => items.filter(item => item.isReadonly), [items]);
    const orderedItems = useMemo(
        () => [...userItems, ...adminItems],
        [adminItems, userItems]
    );
    const shouldShowLeadingIcon = showLeadingIcon && userItems.length > 0;

    const getItemKey = useCallback(
        (item: S3BookmarksBarProps.Item) => stringifyS3Uri(item.s3Uri),
        []
    );

    const resolveCallbacks = useCallback(
        (item: S3BookmarksBarProps.Item) =>
            item.isReadonly
                ? undefined
                : {
                      onDelete: () => onDelete({ s3Uri: item.s3Uri }),
                      onRename: () =>
                          onRename({
                              s3Uri: item.s3Uri,
                              currentDisplayName:
                                  item.displayName === undefined
                                      ? undefined
                                      : resolveLocalizedString(item.displayName)
                          })
                  },
        [onDelete, onRename, resolveLocalizedString]
    );

    useEffect(() => {
        setVisibleCount(orderedItems.length);
    }, [orderedItems.length]);

    const recalculateVisibleCount = useCallback(() => {
        const container = rowRef.current;

        if (!container) {
            return;
        }

        const containerWidth = container.clientWidth;

        if (containerWidth <= 0) {
            return;
        }

        orderedItems.forEach(item => {
            const key = getItemKey(item);
            const element = itemRefs.current.get(key);

            if (element && element.offsetWidth > 0) {
                itemWidths.current.set(key, element.offsetWidth);
            }
        });

        const widths = orderedItems.map(
            item => itemWidths.current.get(getItemKey(item)) ?? 0
        );

        const leadingWidth = shouldShowLeadingIcon
            ? (leadingIconRef.current?.offsetWidth ?? 0)
            : 0;
        const leadingGap =
            shouldShowLeadingIcon && orderedItems.length > 0 ? ITEM_GAP : 0;
        const reservedWidth = leadingWidth + leadingGap;

        const totalWidth = widths.reduce(
            (sum, width, index) => sum + width + (index > 0 ? ITEM_GAP : 0),
            reservedWidth
        );

        if (totalWidth <= containerWidth) {
            setVisibleCount(prev =>
                prev === orderedItems.length ? prev : orderedItems.length
            );
            return;
        }

        const availableWidth = Math.max(
            0,
            containerWidth - reservedWidth - MORE_BUTTON_SIZE - ITEM_GAP
        );
        let usedWidth = 0;
        let nextCount = 0;

        for (const width of widths) {
            const nextWidth = usedWidth + (nextCount > 0 ? ITEM_GAP : 0) + width;

            if (nextWidth <= availableWidth) {
                usedWidth = nextWidth;
                nextCount += 1;
                continue;
            }

            break;
        }

        setVisibleCount(prev => (prev === nextCount ? prev : nextCount));
    }, [getItemKey, orderedItems, shouldShowLeadingIcon]);

    useLayoutEffect(() => {
        recalculateVisibleCount();
    }, [recalculateVisibleCount]);

    useEffect(() => {
        const element = rowRef.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver(() => {
            recalculateVisibleCount();
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [recalculateVisibleCount]);

    const safeVisibleCount = Math.min(visibleCount, orderedItems.length);
    const visibleItems = orderedItems.slice(0, safeVisibleCount);
    const hiddenItems = orderedItems.slice(safeVisibleCount);
    const hasOverflow = hiddenItems.length > 0;
    const firstVisibleAdminIndex =
        userItems.length > 0 && adminItems.length > 0
            ? visibleItems.findIndex(item => item.isReadonly)
            : -1;

    useEffect(() => {
        if (!hasOverflow) {
            setIsPanelOpen(false);
        }
    }, [hasOverflow]);

    const closePanel = () => {
        setIsPanelOpen(false);
    };

    return (
        <div
            className={cx(classes.root, className)}
            aria-label="S3 bookmarks"
            ref={rowRef}
        >
            {shouldShowLeadingIcon && (
                <span
                    className={classes.leadingIconWrapper}
                    aria-hidden="true"
                    ref={leadingIconRef}
                >
                    <Icon icon={getIconUrlByName("Star")} size="small" />
                </span>
            )}
            {visibleItems.map((item, index) => {
                const link = getItemLink({ s3Uri: item.s3Uri });
                const itemKey = getItemKey(item);

                return (
                    <div
                        key={link.href}
                        className={cx(
                            classes.itemWrapper,
                            index === firstVisibleAdminIndex &&
                                classes.itemWrapperWithDivider
                        )}
                        ref={element => {
                            itemRefs.current.set(itemKey, element);
                        }}
                    >
                        <S3BookmarkItem
                            variant="bar"
                            showPinIcon={showItemIcons}
                            displayName={item.displayName}
                            s3Uri={item.s3Uri}
                            link={link}
                            callbacks={resolveCallbacks(item)}
                            isActive={
                                activeItemKey !== undefined && itemKey === activeItemKey
                            }
                        />
                    </div>
                );
            })}
            {hasOverflow && (
                <button
                    ref={moreButtonRef}
                    type="button"
                    className={cx(
                        classes.moreButton,
                        isPanelOpen && classes.moreButtonActive
                    )}
                    onClick={() => setIsPanelOpen(previous => !previous)}
                    aria-label="Show more bookmarks"
                    aria-expanded={isPanelOpen}
                >
                    <Icon icon={getIconUrlByName("MoreHoriz")} size="small" />
                </button>
            )}
            {hasOverflow && (
                <Popper
                    open={isPanelOpen}
                    anchorEl={moreButtonRef.current}
                    placement="bottom-end"
                    modifiers={[
                        {
                            name: "offset",
                            options: { offset: [0, 8] }
                        }
                    ]}
                >
                    <ClickAwayListener onClickAway={closePanel}>
                        <div className={classes.morePanel} role="menu">
                            <div className={classes.panelList}>
                                {hiddenItems.map(item => {
                                    const link = getItemLink({
                                        s3Uri: item.s3Uri
                                    });
                                    const itemKey = getItemKey(item);
                                    const isPanelActive =
                                        activeItemKey !== undefined &&
                                        itemKey === activeItemKey;
                                    const panelLink = {
                                        ...link,
                                        onClick: (event: any) => {
                                            link.onClick?.(event);
                                            closePanel();
                                        }
                                    };

                                    return (
                                        <S3BookmarkItem
                                            key={`${link.href}-panel`}
                                            variant="bar"
                                            disableTooltip={true}
                                            showInlinePath={true}
                                            showPinIcon={showItemIcons}
                                            displayName={item.displayName}
                                            s3Uri={item.s3Uri}
                                            link={panelLink}
                                            callbacks={resolveCallbacks(item)}
                                            isActive={isPanelActive}
                                            className={classes.panelItem}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </ClickAwayListener>
                </Popper>
            )}
        </div>
    );
}

const useStyles = tss.withName({ S3BookmarksBar }).create(({ theme }) => {
    return {
        root: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: ITEM_GAP,
            width: "100%",
            minWidth: 260,
            overflow: "hidden",
            flexWrap: "nowrap",
            boxSizing: "border-box"
        },
        leadingIconWrapper: {
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.useCases.typography.textPrimary,
            padding: "0 2px",
            minWidth: 16,
            flexShrink: 0
        },
        itemWrapper: {
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            minWidth: 0
        },
        itemWrapperWithDivider: {
            position: "relative",
            paddingLeft: theme.spacing(3),
            marginLeft: theme.spacing(1),
            "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 1,
                height: 14,
                borderRadius: 9999,
                backgroundColor: theme.colors.useCases.typography.textTertiary,
                opacity: 0.45
            }
        },
        moreButton: {
            width: 28,
            height: 28,
            borderRadius: 9999,
            border: "none",
            background: "transparent",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.useCases.typography.textTertiary,
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 120ms ease, color 120ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3,
                color: theme.colors.useCases.typography.textPrimary
            }
        },
        moreButtonActive: {
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
            color: theme.colors.useCases.typography.textPrimary
        },
        morePanel: {
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            borderRadius: 12,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            boxShadow: theme.shadows[4],
            padding: theme.spacing(2),
            minWidth: 260,
            maxWidth: 360,
            overflow: "hidden"
        },
        panelList: {
            display: "flex",
            flexDirection: "column",
            gap: PANEL_ROW_GAP
        },
        panelItem: {
            "&&": {
                width: "100%",
                maxWidth: "100%",
                borderRadius: 10,
                flexShrink: 0,
                minHeight: PANEL_ROW_HEIGHT
            }
        }
    };
});
