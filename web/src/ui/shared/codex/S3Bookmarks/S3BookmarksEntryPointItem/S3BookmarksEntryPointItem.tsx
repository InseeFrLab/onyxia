import { tss } from "tss";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";
import { S3BookmarkItem } from "../S3BookmarksBarItem";
import { useResolveLocalizedString } from "ui/i18n";

export type S3BookmarksEntryPointListProps = {
    className?: string;
    items: S3BookmarksEntryPointListProps.Item[];
    activeItemS3Uri: S3Uri | undefined;
    onDelete: (props: { s3Uri: S3Uri }) => void;
    onRename: (props: { s3Uri: S3Uri; currentDisplayName: string | undefined }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
};

export namespace S3BookmarksEntryPointListProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}

export function S3BookmarksEntryPointList(props: S3BookmarksEntryPointListProps) {
    const { className, items, activeItemS3Uri, onDelete, onRename, getItemLink } = props;

    const { classes, cx } = useStyles();
    const { resolveLocalizedString } = useResolveLocalizedString();

    const activeItemKey = activeItemS3Uri ? stringifyS3Uri(activeItemS3Uri) : undefined;
    const customBookmarkItems = items.filter(item => !item.isReadonly);
    const defaultBucketItems = items.filter(item => item.isReadonly);

    const renderGrid = (sectionItems: S3BookmarksEntryPointListProps["items"]) => (
        <div className={classes.grid}>
            {sectionItems.map(item => {
                const link = getItemLink({ s3Uri: item.s3Uri });

                return (
                    <S3BookmarkItem
                        key={link.href}
                        variant="entryPoint"
                        displayName={item.displayName}
                        s3Uri={item.s3Uri}
                        link={link}
                        callbacks={
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
                                                      : resolveLocalizedString(
                                                            item.displayName
                                                        )
                                          })
                                  }
                        }
                        isActive={
                            activeItemKey !== undefined &&
                            stringifyS3Uri(item.s3Uri) === activeItemKey
                        }
                    />
                );
            })}
        </div>
    );

    return (
        <div
            className={cx(classes.root, className)}
            aria-label="S3 bookmark entry points"
        >
            {(customBookmarkItems.length > 0 || items.length === 0) && (
                <section className={classes.section} aria-label="Bookmarks">
                    <h2 className={cx(classes.sectionTitle, classes.sectionTitlePrimary)}>
                        Bookmarks
                    </h2>
                    {customBookmarkItems.length === 0 ? (
                        <div className={classes.emptyState}>No bookmarks yet.</div>
                    ) : (
                        renderGrid(customBookmarkItems)
                    )}
                </section>
            )}
            {defaultBucketItems.length > 0 && (
                <section className={classes.section} aria-label="Storage locations">
                    <h2
                        className={cx(
                            classes.sectionTitle,
                            classes.sectionTitleSecondary
                        )}
                    >
                        Storage locations
                    </h2>
                    {renderGrid(defaultBucketItems)}
                </section>
            )}
        </div>
    );
}

const useStyles = tss.withName({ S3BookmarksEntryPointList }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(6)
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    sectionTitle: {
        ...theme.typography.variants["section heading"].style,
        margin: 0,
        fontWeight: 600
    },
    sectionTitlePrimary: {
        color: theme.colors.useCases.typography.textPrimary
    },
    sectionTitleSecondary: {
        color: theme.colors.useCases.typography.textSecondary
    },
    grid: {
        display: "grid",
        rowGap: theme.spacing(3),
        columnGap: theme.spacing(3),
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 280px))",
        alignItems: "stretch",
        justifyContent: "flex-start"
    },
    emptyState: {
        ...theme.typography.variants["body 1"].style,
        color: theme.colors.useCases.typography.textSecondary,
        padding: theme.spacing(5),
        borderRadius: 16,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        width: "fit-content",
        minWidth: 280,
        maxWidth: "100%"
    }
}));
