import type { ProjectConfigs } from "core/usecases/projectManagement";

export async function testS3CustomConfigConnection(params: {
    customS3Config: ProjectConfigs.CustomS3Config;
}): Promise<
    | {
          isSuccess: true;
      }
    | {
          isSuccess: false;
          error: string;
      }
> {
    const { customS3Config } = params;

    const { createS3Client } = await import("core/adapters/s3Client/default");

    const s3Client = createS3Client({
        "url": customS3Config.url,
        "pathStyleAccess": customS3Config.pathStyleAccess,
        "isStsEnabled": false,
        "region": customS3Config.region,
        "accessKeyId": customS3Config.accessKeyId,
        "secretAccessKey": customS3Config.secretAccessKey,
        "sessionToken": customS3Config.sessionToken
    });

    try {
        await s3Client.list({
            "path": customS3Config.workingDirectoryPath
        });
    } catch (error) {
        return {
            "isSuccess": false,
            "error": String(error)
        };
    }

    return {
        "isSuccess": true
    };
}
