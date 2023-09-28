import { SemVer } from "../../tools/SemVer";
import * as fs from "fs";

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
        "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/blob/v${tagName}/src/core/ports/OnyxiaApi/XOnyxia.ts`,
        "tagName": onyxiaTag
    });

    readmeText =
        readmeText.replace(
            /--version "?[^ "]+"?/g,
            `--version "${SemVer.stringify(targetChartVersion)}"`
        );

    return readmeText;

}

function updateUrl(
    params: {
        text: string;
        getUrl: (tagName: string) => string;
        tagName: string;
    }
): string {

    const { text, getUrl, tagName } = params;

    const uniqueId = "xKMdKx9dMxK*{#++";

    const [p1, p2] = getUrl(uniqueId).split(uniqueId);

    return text.replace(
        new RegExp(
            `(${p1.replace("/", "\\/")})[^\\/]+(${p2.replace("/", "\\/")})`, "g"),
        (...[, p1, p2]) => `${p1}${tagName}${p2}`
    );

}
