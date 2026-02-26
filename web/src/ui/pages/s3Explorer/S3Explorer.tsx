import type { S3Uri } from "core/tools/S3Uri";

export type Props = {
    className?: string;
    isListing: boolean;

    listedPrefix:
        | {
              isErrored: true;
              errorCase: "access denied" | "no such bucket";
          }
        | {
              isErrored: false;
              bookmarkStatus:
                  | {
                        isBookmarked: false;
                    }
                  | {
                        isBookmarked: true;
                        isReadonly: boolean;
                    };
              items: Item[];
          };
    listPrefix: (params: { s3UriPrefix: S3Uri.Prefix.TerminatedByDelimiter }) => void;
    getPresignedDownloadUrl: (params: { s3Uri: S3Uri.Object }) => Promise<string>;
};

export type Item = Item.PrefixSegment | Item.Object;

export namespace Item {
    type Common = {
        uploadProgressPercent: number | undefined;
        isDeleting: boolean;
        displayName: string;
    };

    export type PrefixSegment = Common & {
        type: "prefix segment";
        s3UriPrefix: S3Uri.Prefix;
    };

    export type Object = Common & {
        type: "object";
        s3Uri: S3Uri.Object;
    };
}

export function S3Explorer(props: Props) {
    return null;
}
