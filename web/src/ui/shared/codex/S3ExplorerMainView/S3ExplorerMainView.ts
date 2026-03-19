import type { S3Uri } from "core/tools/S3Uri";

export type S3ExplorerMainViewProps = {
    className?: string;

    isListing: boolean;
    listedPrefix:
        | {
              isErrored: true;
              errorCase: "access denied" | "no such bucket";
          }
        | {
              isErrored: false;
              items: S3ExplorerMainViewProps.Item[];
          };

    onNavigate: (params: { s3Uri: S3Uri }) => void;

    onPutObjects: (params: {
        files: {
            relativePathSegments: string[];
            fileBasename: string;
            blob: Blob;
        }[];
    }) => void;

    onCreateDirectory: (params: { prefixSegment: string }) => void;

    onDelete: (params: { s3Uris: S3Uri[] }) => void;

    getDirectDownloadUrl: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => Promise<string>;
};

export namespace S3ExplorerMainViewProps {
    export type Item = Item.PrefixSegment | Item.Object;

    export namespace Item {
        type Common = {
            uploadProgressPercent: number | undefined;
            isDeleting: boolean;
            displayName: string;
        };

        export type PrefixSegment = Common & {
            type: "prefix segment";
            s3Uri: S3Uri.TerminatedByDelimiter;
        };

        export type Object = Common & {
            type: "object";
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            size: number;
            lastModified: number;
        };
    }
}

export function S3ExplorerMainView(props: S3ExplorerMainViewProps) {
    return null;
}
