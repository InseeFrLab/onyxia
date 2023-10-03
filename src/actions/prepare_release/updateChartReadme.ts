import { SemVer } from "../../tools/SemVer";
import { updateUrl } from "../../tools/updateUrl";

export function updateChartReadme(
    params: {
        readmeText: string;
        apiVersionTag: string;
        webVersionTag: string;
        releaseVersion: SemVer;
    }
): string {

    let { readmeText, apiVersionTag, webVersionTag, releaseVersion } = params;

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia-api/blob/${tagName}/README.md#configuration`,
        "tagName": apiVersionTag
    });

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/blob/${tagName}/web/.env`,
        "tagName": webVersionTag
    });

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/releases/download/${tagName}/keycloak-theme.jar`,
        "tagName": `v${SemVer.stringify(releaseVersion)}}`
    });

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/blob/${tagName}/web/src/core/ports/OnyxiaApi/XOnyxia.ts`,
        "tagName": webVersionTag
    });

    readmeText =
        readmeText.replace(
            /--version "?[^ "]+"?/g,
            `--version "${SemVer.stringify(releaseVersion)}"`
        );

    return readmeText;

}
