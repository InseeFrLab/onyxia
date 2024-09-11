export function getHelmValuesPathDeeperCommonSubpath(params: {
    helmValuesPath1: (string | number)[];
    helmValuesPath2: (string | number)[];
}): (string | number)[] {
    const { helmValuesPath1, helmValuesPath2 } = params;

    const helmValuesPath: (string | number)[] = [];

    for (let i = 0; i < Math.min(helmValuesPath1.length, helmValuesPath2.length); i++) {
        if (helmValuesPath1[i] !== helmValuesPath2[i]) {
            break;
        }

        helmValuesPath.push(helmValuesPath1[i]);
    }

    return helmValuesPath;
}
