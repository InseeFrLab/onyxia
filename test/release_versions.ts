import assert from "node:assert/strict";
import {
    determineReleaseCandidateChartVersion,
    determineStableTargetChartVersion,
    isReleaseCandidateRequested
} from "../src/actions/prepare_release/determineTargetChartVersion";
import { SemVer } from "../src/tools/SemVer";

function versions(params: {
    chart: string;
    web: string;
    api?: string;
}) {
    return {
        "chartVersion": SemVer.parse(params.chart),
        "webVersion": SemVer.parse(params.web),
        "apiVersion": SemVer.parse(params.api ?? "v0.30.0")
    };
}

const previousReleaseVersions = versions({
    "chart": "11.5.1",
    "web": "5.5.2"
});

assert.equal(
    SemVer.stringify(
        determineReleaseCandidateChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.5.1",
                "web": "5.6.0-rc.1"
            })
        })
    ),
    "11.6.0-rc.1"
);

assert.equal(
    SemVer.stringify(
        determineReleaseCandidateChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.6.0-rc.1",
                "web": "5.6.0-rc.2"
            })
        })
    ),
    "11.6.0-rc.2"
);

assert.equal(
    SemVer.stringify(
        determineReleaseCandidateChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.6.0-rc.2",
                "web": "5.6.0-rc.1"
            })
        })
    ),
    "11.6.0-rc.2"
);

assert.equal(
    SemVer.stringify(
        determineReleaseCandidateChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.5.2-rc.1",
                "web": "5.5.2"
            })
        })
    ),
    "11.5.2-rc.1"
);

assert.equal(
    SemVer.stringify(
        determineStableTargetChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.6.0-rc.2",
                "web": "5.6.0"
            })
        })
    ),
    "11.6.0"
);

assert.equal(
    isReleaseCandidateRequested({
        previousReleaseVersions,
        "currentVersions": versions({
            "chart": "11.5.1",
            "web": "5.6.0-rc.1"
        })
    }),
    true
);

assert.equal(
    isReleaseCandidateRequested({
        previousReleaseVersions,
        "currentVersions": versions({
            "chart": "11.5.2-rc.1",
            "web": "5.5.2"
        })
    }),
    true
);

assert.equal(
    isReleaseCandidateRequested({
        previousReleaseVersions,
        "currentVersions": versions({
            "chart": "11.6.0-rc.1",
            "web": "5.6.0"
        })
    }),
    false
);

assert.equal(
    SemVer.stringify(
        determineReleaseCandidateChartVersion({
            previousReleaseVersions,
            "currentVersions": versions({
                "chart": "11.5.1",
                "web": "5.5.2",
                "api": "v0.31.0-rc.3"
            })
        })
    ),
    "11.6.0-rc.3"
);

console.log("Release version tests passed");
