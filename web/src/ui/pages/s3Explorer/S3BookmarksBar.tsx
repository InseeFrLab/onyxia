import type { S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { Link } from "type-route";

type Props = {
    className?: string;
    bookmarks: {
        displayName: LocalizedString;
        link: Link;
    }[];
};

export function S3BookmarksBar(props: Props) {
    return null;
}
