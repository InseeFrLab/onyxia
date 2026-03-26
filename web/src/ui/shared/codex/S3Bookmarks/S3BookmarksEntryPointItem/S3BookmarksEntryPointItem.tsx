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

    return (
        <div
            className={cx(classes.root, className)}
            aria-label="S3 bookmark entry points"
        >
            {items.map(item => {
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
}

const useStyles = tss.withName({ S3BookmarksEntryPointList }).create(() => ({
    root: {
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        alignItems: "stretch"
    }
}));
