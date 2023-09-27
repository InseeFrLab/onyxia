
import type { Versions } from "./readVersions";
import { SemVer } from "../../tools/SemVer";
import { assert } from "tsafe/assert";

export function determineTargetChartVersion(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): SemVer {

    const {
        previousReleaseVersions,
        currentVersions
    } = params;

    const getWeightFromBumpType = (bumpType: SemVer.BumpType): number => {
        assert(bumpType !== "rc");
        switch (bumpType) {
            case "no bump": return 0;
            case "patch": return 1;
            case "minor": return 2;
            case "major": return 3;
        }
    };

    const getBumpTypeFromWeight = (weight: number): Exclude<SemVer.BumpType, "rc"> => {
        switch (weight) {
            case 0: return "no bump";
            case 1: return "patch";
            case 2: return "minor";
            case 3: return "major";
        }
        assert(false);
    }

    const minimumBumpType = getBumpTypeFromWeight(
        Math.max(
            getWeightFromBumpType(
                SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.apiVersion,
                    "versionAhead": currentVersions.apiVersion
                })
            ),
            getWeightFromBumpType(
                SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.webVersion,
                    "versionAhead": currentVersions.webVersion
                })
            )
        )
    );

    const chartBumpType =
        SemVer.bumpType({
            "versionBehind": previousReleaseVersions.chartVersion,
            "versionAhead": currentVersions.chartVersion
        });

    let targetChartVersion = { ...currentVersions.chartVersion };

    switch (minimumBumpType) {
        case "no bump": return targetChartVersion;
        case "patch": {

            if (chartBumpType === "no bump") {
                targetChartVersion.patch++;
            }

            return targetChartVersion;


        }
        case "minor": {

            if (chartBumpType === "no bump" || chartBumpType === "patch") {
                targetChartVersion = { ...previousReleaseVersions.chartVersion };
                targetChartVersion.minor++;
                targetChartVersion.patch = 0;
            }

            return targetChartVersion;

        }
        case "major": {

            if (chartBumpType === "no bump" || chartBumpType === "patch" || chartBumpType === "minor") {
                targetChartVersion = { ...previousReleaseVersions.chartVersion };
                targetChartVersion.major++;
                targetChartVersion.minor = 0;
                targetChartVersion.patch = 0;
            }

            return targetChartVersion;

        }

    }

}