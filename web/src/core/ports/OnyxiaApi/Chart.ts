export type Chart = {
    name: string;
    versions: {
        description: string | undefined;
        version: string;
        iconUrl: string | undefined;
        projectHomepageUrl: string | undefined;
    }[];
};

export namespace Chart {
    export function getDefaultVersion(chart: Chart): string {
        // NOTE: We assume that version are sorted from the most recent to the oldest.
        // We do not wat to automatically select prerelease or beta version (version that contains "-"
        // like 1.3.4-rc.0 or 1.2.3-beta.2 ).
        const chartVersion = chart.versions.find(
            ({ version }) => !version.includes("-")
        )?.version;

        if (chartVersion === undefined) {
            return chart.versions[0].version;
        }

        return chartVersion;
    }
}
