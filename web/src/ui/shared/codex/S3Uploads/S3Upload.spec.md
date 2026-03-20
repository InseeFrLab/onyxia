```ts
import type { Link } from "type-route";

type S3UploadsProps = {
    // We expect the component to have a fixed with specified by the parent.
    className?: string;
    uploads: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        directoryLink: Link;
        size: number; // In Bytes
        completionPercent: number; // From 0 to 100 - Example: 35
    }[];
    onClearCompleted: () => void;
};
```
