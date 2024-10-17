import { join as pathJoin } from "pathe";

export function getProjectVaultTopDirPath_reserved(params: {
    projectVaultTopDirPath: string;
}) {
    const { projectVaultTopDirPath } = params;

    return pathJoin(projectVaultTopDirPath, ".onyxia");
}
