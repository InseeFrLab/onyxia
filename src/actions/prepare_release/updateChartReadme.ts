import { SemVer } from "../../tools/SemVer";
import { updateUrl } from "../../tools/updateUrl";

export function updateChartReadme(
    params: {
        readmeText: string;
        apiVersionTag: string;
        targetChartVersion: SemVer;
    }
): string {

    let { readmeText, apiVersionTag, targetChartVersion } = params;

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia-api/blob/${tagName}/README.md#configuration`,
        "tagName": apiVersionTag
    });

    const onyxiaTag = `v${SemVer.stringify(targetChartVersion)}`;

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/blob/${tagName}/web/.env`,
        "tagName": onyxiaTag
    });

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/releases/download/${tagName}/keycloak-theme.jar`,
        "tagName": onyxiaTag
    });

    readmeText = updateUrl({
        "text": readmeText,
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/blob/${tagName}/web/src/core/ports/OnyxiaApi/XOnyxia.ts`,
        "tagName": onyxiaTag
    });

    readmeText =
        readmeText.replace(
            /--version "?[^ "]+"?/g,
            `--version "${SemVer.stringify(targetChartVersion)}"`
        );

    return readmeText;

}
