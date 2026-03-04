import { breakpointsValues } from "onyxia-ui";
import { tss } from "tss";
import { BookmarkRowItem } from "./BookmarkRowItem";
import type { Bookmark, BucketEntry, BucketType } from "./types";

export type EntryPointsListProps = {
    buckets: BucketEntry[];
    pinned: Array<Bookmark & { subLabel?: string }>;
    currentPath: string;
    onNavigate: (path: string) => void;
    onUnpin: (path: string) => void;
};

export function EntryPointsList(props: EntryPointsListProps) {
    const { buckets, pinned, currentPath, onNavigate, onUnpin } = props;
    const { classes } = useStyles();
    type EntryItem = {
        key: string;
        label: string;
        path: string;
        subLabel?: string;
        bucketType?: BucketType;
        variant: "pinned" | "bucket";
    };
    const hasCreatedAt = pinned.some(bookmark => Boolean(bookmark.createdAt));
    const orderedPinned = hasCreatedAt
        ? [...pinned].sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
              }

              if (a.createdAt) {
                  return -1;
              }

              if (b.createdAt) {
                  return 1;
              }

              return 0;
          })
        : [...pinned].reverse();
    const bucketOrder: BucketType[] = ["personal", "group", "read-write", "read-only"];
    const bucketPriority = new Map(bucketOrder.map((type, index) => [type, index]));
    const orderedBuckets = [...buckets].sort((a, b) => {
        const aPriority = bucketPriority.get(a.type) ?? bucketOrder.length;
        const bPriority = bucketPriority.get(b.type) ?? bucketOrder.length;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        return 0;
    });

    const items: EntryItem[] = [
        ...orderedPinned.map(bookmark => ({
            key: bookmark.id,
            label: bookmark.label,
            path: bookmark.path,
            subLabel: bookmark.subLabel,
            variant: "pinned" as const
        })),
        ...orderedBuckets.map(bucket => ({
            key: bucket.path,
            label: bucket.label,
            path: bucket.path,
            bucketType: bucket.type,
            variant: "bucket" as const
        }))
    ];

    return (
        <div className={classes.root} aria-label="Entry points">
            <div className={classes.grid}>
                {items.map(item => (
                    <BookmarkRowItem
                        key={item.key}
                        label={item.label}
                        path={item.path}
                        subLabel={item.subLabel}
                        bucketType={item.bucketType}
                        active={item.path === currentPath}
                        onSelect={onNavigate}
                        onUnpin={item.variant === "pinned" ? onUnpin : undefined}
                        variant={item.variant}
                    />
                ))}
            </div>
        </div>
    );
}

// TODO: Add search, grouping, and empty state handling.

const useStyles = tss.withName({ EntryPointsList }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    grid: {
        display: "grid",
        gridTemplateColumns: `repeat(${(() => {
            if (theme.windowInnerWidth >= breakpointsValues.xl) {
                return 5;
            }
            if (theme.windowInnerWidth >= breakpointsValues.lg) {
                return 4;
            }
            if (theme.windowInnerWidth >= breakpointsValues.md) {
                return 3;
            }
            if (theme.windowInnerWidth >= breakpointsValues.sm) {
                return 2;
            }

            return 1;
        })()}, minmax(0, 1fr))`,
        gridAutoRows: "162px",
        gap: theme.spacing(2),
        justifyContent: "flex-start"
    }
}));
