import { SemVer } from "../../tools/SemVer";
import { assert } from "tsafe/assert";
import { capitalize } from "tsafe/capitalize";

export function generateReleaseMessageBody(params: {
    chartVersions: {
        previous: SemVer;
        new: SemVer;
    };
    webVersions: {
        previous: SemVer;
        new: SemVer;
    };
    apiVersions: {
        previous: SemVer;
        new: SemVer;
    };
}): string {

    const {
        chartVersions,
        webVersions,
        apiVersions
    } = params;


    const getChartUrl = (version: SemVer) => `https://github.com/InseeFrLab/onyxia/tree/v${SemVer.stringify(version)}/helm-chart`;
    const getWebUrl = (version: SemVer) => `https://github.com/InseeFrLab/onyxia/tree/${getWebTagName(version)}/web`;
    const getApiUrl = (version: SemVer) => `https://github.com/InseeFrLab/onyxia-api/tree/${version.parsedFrom}`;

    const getPrettyBump = (versionBehind: SemVer, versionAhead: SemVer) => {
        const bump = SemVer.bumpType({ versionBehind, versionAhead });

        assert(bump !== "rc");
        assert(bump !== "no bump");

        let out = capitalize(bump);

        if (bump === "major") {
            out += `**${out}**`;
        }

        return out;

    }

    return [
        `📖 [Documentation reference](${getChartUrl(chartVersions.new)}/README.md#configuration)  `,
        `  `,
        [
            `📦 [Helm Chart](${getChartUrl(chartVersions.new)}) version:`,
            `**[\`${SemVer.stringify(chartVersions.new)}\`](${getChartUrl(chartVersions.new)})**`,
            `*(${getPrettyBump(chartVersions.previous, chartVersions.new)} bump from [\`${SemVer.stringify(chartVersions.previous)}\`](${getChartUrl(chartVersions.previous)}))*`
        ].join(" "),
        [
            `- 🖥️ Version of [\`inseefrlab/onyxia-web\`](https://hub.docker.com/r/inseefrlab/onyxia-web) pinned in the chart:`,
            `**[\`${SemVer.stringify(webVersions.new)}\`](${getWebUrl(webVersions.new)})**`,
            SemVer.compare(webVersions.previous, webVersions.new) === 0 ?
                "(No bump since the previous release)" :
                `*(${getPrettyBump(webVersions.previous, webVersions.new)} bump from [\`${SemVer.stringify(webVersions.previous)}\`](${getWebUrl(webVersions.previous)}))*`
        ].join(" "),
        [
            `- 🔌 Version of [\`inseefrlab/onyxia-api\`](https://hub.docker.com/r/inseefrlab/onyxia-api) pinned in the chart:`,
            `**[\`${apiVersions.new.parsedFrom}\`](${getApiUrl(apiVersions.new)})**`,
            SemVer.compare(apiVersions.previous, apiVersions.new) === 0 ?
                "(No bump since the previous release)" :
                `*(${getPrettyBump(apiVersions.previous, apiVersions.new)} bump from [\`${apiVersions.previous.parsedFrom}\`](${getApiUrl(apiVersions.previous)}))*`
        ].join(" "),
    ].join("\n");

}

export function getWebTagName(version: SemVer){
    return `web-v${SemVer.stringify(version)}`;
};