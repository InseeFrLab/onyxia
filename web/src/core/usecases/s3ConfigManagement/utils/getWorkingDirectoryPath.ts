import { assert, type Equals } from "tsafe/assert";
import type { DeploymentRegion } from "core/ports/OnyxiaApi";

export function getWorkingDirectoryPath(params: {
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
}): string {
    const { workingDirectory, context } = params;

    return (
        (() => {
            switch (workingDirectory.bucketMode) {
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
                case "shared":
                    return [
                        workingDirectory.bucketName,
                        (() => {
                            switch (context.type) {
                                case "personalProject":
                                    return `${workingDirectory.prefix}${context.username}`;
                                case "groupProject":
                                    return `${workingDirectory.prefixGroup}${context.projectGroup}`;
                            }
                            assert<Equals<typeof context, never>>(true);
                        })()
                    ].join("/");
            }
            assert<Equals<typeof workingDirectory, never>>(false);
        })()
            .trim()
            .replace(/\/\//g, "/") // Remove double slashes if any
            .replace(/^\//g, "") // Ensure no leading slash
            .replace(/\/+$/g, "") + "/" // Enforce trailing slash
    );
}
