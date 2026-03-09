import { getCoreSync, useCoreState } from "core";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { assert } from "tsafe/assert";
import { routes } from "ui/routes";
import { S3BookmarksBar as S3BookmarksBarView } from "ui/shared/codex/S3BookmarksBar";

type Props = {
    className?: string;
};

export function S3BookmarksBar(props: Props) {
    const { className } = props;

    const mainView = useCoreState("s3ExplorerUiController", "mainView");
    const profileName = mainView.profileSelect?.value;

    const {
        functions: { s3ProfilesManagement }
    } = getCoreSync();

    if (profileName === undefined) {
        return null;
    }

    return (
        <S3BookmarksBarView
            className={className}
            items={mainView.bookmarks.map(bookmark => ({
                displayName: bookmark.displayName,
                s3Uri: bookmark.s3UriPrefix,
                isReadonly: bookmark.isReadonly
            }))}
            activeItemS3Uri={mainView.navigationUri}
            getItemLink={({ s3Uri }) => {
                const s3UriStr = stringifyS3Uri(s3Uri);

                return routes.s3Explorer({
                    s3UriPrefixWithoutScheme: s3UriStr.slice("s3://".length),
                    profile: profileName
                }).link;
            }}
            onDelete={({ s3Uri }) => {
                assert(s3Uri.type === "prefix");

                s3ProfilesManagement.createDeleteOrUpdateBookmark({
                    profileName,
                    s3UriPrefix: s3Uri,
                    action: { type: "delete" }
                });
            }}
        />
    );
}
