```ts
import type { S3Uri } from "core/tools/S3Uri";

type S3SelectionActionBarProps = {
    className?: string;
    /** When mounted there is at least one item in the list */
    selectedS3Uris: S3Uri[];
    /** Always visible */
    onDownload: () => void;
    /** Only visible when only one item is selected */
    onCopyS3Uri: () => void;

    /** Always visible */
    onDelete: () => void;

    /** Only visible when selectedS3Uris contains one element
     *  and this element is of type S3Uri.NonTerminatedByDelimiter */
    onShare: () => void;

    /** Only visible when one element is selected */
    onRename: () => void;
};
```
