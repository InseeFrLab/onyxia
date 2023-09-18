

export type NpmModuleVersion = {
    major: number;
    minor: number;
    patch: number;
    rc?: number;
};

export namespace NpmModuleVersion {

    export function parse(versionStr: string): NpmModuleVersion {

        const match = versionStr.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-rc.([0-9]+))?$/);

        if (!match) {
            throw new Error(`${versionStr} is not a valid NPM version`);
        }

        return {
            "major": parseInt(match[1]),
            "minor": parseInt(match[2]),
            "patch": parseInt(match[3]),
            ...(() => {

                const str = match[4];
                return str === undefined ?
                    {} :
                    { "rc": parseInt(str) };

            })()
        };

    };

    export function stringify(v: NpmModuleVersion) {
        return `${v.major}.${v.minor}.${v.patch}${v.rc === undefined ? "" : `-rc.${v.rc}`}`;
    }

    /**
     * 
     * v1  <  v2  => -1
     * v1 === v2  => 0
     * v1  >  v2  => 1
     * 
     */
    export function compare(v1: NpmModuleVersion, v2: NpmModuleVersion): -1 | 0 | 1 {

        const sign = (diff: number): -1 | 0 | 1 => diff === 0 ? 0 : (diff < 0 ? -1 : 1);
        const noUndefined= (n: number | undefined)=> n ?? Infinity;

        for (const level of ["major", "minor", "patch", "rc"] as const) {
            if (noUndefined(v1[level]) !== noUndefined(v2[level])) {
                return sign(noUndefined(v1[level]) - noUndefined(v2[level]));
            }
        }

        return 0;

    }

    /*
    console.log(compare(parse("3.0.0-rc.3"), parse("3.0.0")) === -1 )
    console.log(compare(parse("3.0.0-rc.3"), parse("3.0.0-rc.4")) === -1 )
    console.log(compare(parse("3.0.0-rc.3"), parse("4.0.0")) === -1 )
    */

    export function bumpType(
        params: {
            versionBehindStr: string;
            versionAheadStr: string;
        }
    ): "major" | "minor" | "patch" | "rc" | "same" {


        const versionAhead = parse(params.versionAheadStr);
        const versionBehind = parse(params.versionBehindStr);

        if (compare(versionBehind, versionAhead) === 1) {
            throw new Error(`Version regression ${versionBehind} -> ${versionAhead}`);
        }

        for (const level of ["major", "minor", "patch", "rc"] as const) {
            if (versionBehind[level] !== versionAhead[level]) {
                return level;
            }
        }

        return "same";

    }

}

