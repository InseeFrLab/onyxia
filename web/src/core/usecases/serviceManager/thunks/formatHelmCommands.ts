export function formatHelmLsResp(params: {
    lines: {
        namespace: string;
        name: string;
        revision: string;
        updated: string;
        status: string;
        chart: string;
        appVersion: string;
    }[];
}): string {
    const { lines } = params;

    const minPadding = 7;

    const header = {
        ...(() => {
            const key = "NAME";

            const nameMaxLength = Math.max(...lines.map(({ name }) => name.length));

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(nameMaxLength + 3 - key.length, minPadding)
                )} `
            };
        })(),
        ...(() => {
            const key = "NAMESPACE";

            const maxNamespaceLength = Math.max(
                ...lines.map(({ namespace }) => namespace.length)
            );

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(maxNamespaceLength - key.length, minPadding)
                )} `
            };
        })(),
        ...(() => {
            const key = "REVISION";

            return {
                [key]: `${key}${" ".repeat(minPadding)} `
            };
        })(),
        ...(() => {
            const key = "UPDATED";

            return {
                [key]: `${key}${" ".repeat(
                    "2023-10-06 14:34:54.652220476 +0000 UTC".length - key.length
                )} `
            };
        })(),
        ...(() => {
            const key = "STATUS";

            return { [key]: `${key}${" ".repeat(minPadding)} ` };
        })(),
        ...(() => {
            const key = "CHART";

            const chartMaxLength = Math.max(...lines.map(({ chart }) => chart.length));

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(chartMaxLength - key.length, minPadding)
                )} `
            };
        })(),
        ...(() => {
            const key = "APP VERSION";

            return { [key]: `${key}${" ".repeat(minPadding)} ` };
        })()
    };

    return [
        Object.values(header).join(""),
        ...lines.map(
            ({ name, namespace, revision, updated, chart, status, appVersion }) =>
                [
                    name.padEnd(header.NAME.length),
                    namespace.padEnd(header.NAMESPACE.length),
                    revision.padEnd(header.REVISION.length),
                    updated.padEnd(header.UPDATED.length),
                    status.padEnd(header.STATUS.length),
                    chart.padEnd(header.CHART.length),
                    appVersion.padEnd(header["APP VERSION"].length)
                ].join("")
        )
    ].join("\n");
}
