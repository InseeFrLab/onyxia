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

    const minPadding = 7;

    const formatTime = (time: number) =>
        new Date(time).toLocaleDateString("en-US", {
            "year": "numeric",
            "month": "short",
            "day": "numeric",
            "hour": "2-digit",
            "minute": "2-digit"
        });

    const header = {
        ...(() => {
            const key = "NAME";

            const nameMaxLength = Math.max(...lines.map(({ name }) => name.length));

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(nameMaxLength + 2 - key.length, minPadding)
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
                [key]: `${key}${" ".repeat(2)} `
            };
        })(),
        ...(() => {
            const key = "UPDATED";

            return {
                [key]: `${key}${" ".repeat(formatTime(Date.now()).length - key.length)}  `
            };
        })(),
        ...(() => {
            const key = "STATUS";

            return { [key]: `${key}${" ".repeat(3)} ` };
        })(),
        ...(() => {
            const key = "CHART";

            const chartMaxLength = Math.max(...lines.map(({ chart }) => chart.length));

            return {
                [key]: `${key}${" ".repeat(
                    Math.max(chartMaxLength - key.length, minPadding)
                )}  `
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
