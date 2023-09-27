import { SemVer } from "../../tools/SemVer";

export function updateChartReadme(
    params: {
        readmeText: string;
        apiVersionTag: string;
        targetChartVersion: SemVer;
    }
): string {

    let { readmeText, apiVersionTag, targetChartVersion } = params;

    readmeText =
        readmeText.replace(
            /(https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/)([^\/]+)(\/README\.md#configuration)/g,
            (...[, p1, , p3]) => `${p1}${apiVersionTag}${p3}`
        );

    readmeText =
        readmeText.replace(
            /(https:\/\/github\.com\/[\/]+\/[\/]+\/blob\/)([^\/]+)(\/\.env)/g,
            (...[, p1, , p3]) => `${p1}v${SemVer.stringify(targetChartVersion)}${p3}`
        );

    readmeText =
        readmeText.replace(
            /(https:\/\/github\.com\/[\/]+\/[\/]+\/blob\/)([^\/]+)(\/src\/core\/ports\/OnyxiaApi\/XOnyxia\.ts)/g,
            (...[, p1, , p3]) => `${p1}v${SemVer.stringify(targetChartVersion)}${p3}`
        );

    readmeText =
        readmeText.replace(
            /(https:\/\/github\.com\/[\/]+\/[\/]+\/release\/download\/)([^\/]+)(\/keycloak-theme\.jar)/g,
            (...[, p1, , p3]) => `${p1}v${SemVer.stringify(targetChartVersion)}${p3}`
        );

    readmeText =
        readmeText.replace(
            /--version "?[^ "]+"?/g,
            `--version "${SemVer.stringify(targetChartVersion)}"`
        );

    return readmeText;

}