
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

export function determineReleaseCandidateChartVersion(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): SemVer {

    const { currentVersions } = params;

    const rcNumbers = [
        currentVersions.webVersion.rc,
        currentVersions.apiVersion.rc,
        currentVersions.chartVersion.rc
    ].filter((rc): rc is number => rc !== undefined);

    assert(rcNumbers.length !== 0);

    return {
        ...determineTargetChartVersion(params),
        "rc": Math.max(...rcNumbers)
    };

}

export function determineStableTargetChartVersion(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): SemVer {

    const version = determineTargetChartVersion(params);

    // A chart release candidate can be merged before its stable release.
    // Stable releases from the main branch must never retain that suffix.
    delete version.rc;

    return version;

}

export function isReleaseCandidateRequested(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): boolean {

    const { previousReleaseVersions, currentVersions } = params;

    if (
        currentVersions.webVersion.rc !== undefined ||
        currentVersions.apiVersion.rc !== undefined
    ) {
        return true;
    }

    const isApplicationVersionChanged =
        SemVer.compare(previousReleaseVersions.webVersion, currentVersions.webVersion) !== 0 ||
        SemVer.compare(previousReleaseVersions.apiVersion, currentVersions.apiVersion) !== 0;

    // A chart RC also opts in when the application versions are unchanged. If
    // the web or API version has been stabilized while Chart.yaml still contains
    // an RC left by the candidate build, this PR is preparing the stable release.
    return !isApplicationVersionChanged && currentVersions.chartVersion.rc !== undefined;

}
