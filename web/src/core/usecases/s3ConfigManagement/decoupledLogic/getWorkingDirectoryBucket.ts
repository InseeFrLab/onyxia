import { assert, type Equals } from "tsafe/assert";
import type { DeploymentRegion } from "core/ports/OnyxiaApi";

export function getWorkingDirectoryBucketToCreate(params: {
    workingDirectory: DeploymentRegion.S3Config["workingDirectory"];
    context:
        | {
              type: "personalProject";
              username: string;
          }
        | {
              type: "groupProject";
              projectGroup: string;
          };
}): string | undefined {
    const { workingDirectory, context } = params;

    switch (workingDirectory.bucketMode) {
        case "shared":
            return undefined;
        case "multi":
            return (() => {
                switch (context.type) {
                    case "personalProject":
                        return `${workingDirectory.bucketNamePrefix}${context.username}`;
                    case "groupProject":
                        return `${workingDirectory.bucketNamePrefixGroup}${context.projectGroup}`;
                }
                assert<Equals<typeof context, never>>(false);
            })();
    }
    assert<Equals<typeof workingDirectory, never>>(false);
}
