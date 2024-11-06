function generateUniqDefaultNameRec(
    params: Parameters<typeof generateUniqDefaultName>[0] & {
        n: number;
    }
): string {
    const { names, buildName, n } = params;

    const candidateName = buildName(n);

    if (!names.includes(candidateName)) {
        return candidateName;
    }

    return generateUniqDefaultNameRec({
        names,
        buildName,
        n: n + 1
    });
}

export function generateUniqDefaultName(params: {
    names: string[];
    buildName: (n: number) => string;
}): string {
    return generateUniqDefaultNameRec({
        ...params,
        n: 1
    });
}

/** buildNameFactory({ "defaultName": "foo", "separator": " " })(33) === "foo 33" */
export function buildNameFactory(params: { defaultName: string; separator: string }) {
    const { defaultName, separator } = params;

    return (n: number) => `${defaultName}${n === 1 ? "" : `${separator}${n - 1}`}`;
}
