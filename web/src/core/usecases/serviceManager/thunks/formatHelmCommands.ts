export function formatHelmLsResp(params: {
    lines: {
        namespace: string;
        name: string;
        revision: string;
        updatedTime: number;
        status: string;
        chart: string;
        appVersion: string;
    }[];
}): string {
    const { lines } = params;

    const formatTime = (unixTimestampMs: number) => {
        const date = new Date(unixTimestampMs);
        return date.toISOString() + " " + date.getTimezoneOffset() / 60 + " UTC";
    };

    const header = {
        ...(() => {
            const key = "NAME";

            const nameMaxLength = Math.max(...lines.map(({ name }) => name.length));

            return {
                [key]: `${key}${" ".repeat(Math.max(nameMaxLength - key.length, 7))} `
            };
        })(),
        ...(() => {
            const key = "NAMESPACE";

            const maxNamespaceLength = Math.max(
                ...lines.map(({ namespace }) => namespace.length)
            );

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(maxNamespaceLength - key.length, 7)
                )} `
            };
        })(),
        ...(() => {
            const key = "REVISION";

            return {
                [key]: `${key}${" ".repeat(7)} `
            };
        })(),
        ...(() => {
            const key = "UPDATED";

            return { [key]: `${key}${" ".repeat(formatTime(Date.now()).length)} ` };
        })(),
        ...(() => {
            const key = "STATUS";

            return { [key]: `${key}${" ".repeat(7)} ` };
        })(),
        ...(() => {
            const key = "CHART";

            const chartMaxLength = Math.max(...lines.map(({ chart }) => chart.length));

            return {
                [key]: `${key}${" ".repeat(Math.max(chartMaxLength - key.length, 7))} `
            };
        })(),
        ...(() => {
            const key = "APP VERSION";

            return { [key]: `${key}${" ".repeat(7)} ` };
        })()
    };

    return [
        Object.values(header).join(""),
        ...lines.map(
            ({ name, namespace, revision, updatedTime, chart, status, appVersion }) =>
                [
                    name.padEnd(header.NAME.length),
                    namespace.padEnd(header.NAMESPACE.length),
                    revision.padEnd(header.REVISION.length),
                    formatTime(updatedTime).padEnd(header.UPDATED.length),
                    status.padEnd(header.STATUS.length),
                    chart.padEnd(header.CHART.length),
                    appVersion.padEnd(header["APP VERSION"].length)
                ].join("")
        )
    ].join("\n");
}
