

export type SemVer = {
    major: number;
    minor: number;
    patch: number;
};

export namespace SemVer {
    
    export function removeVPrefix(versionStr: string): string { 
        return versionStr.replace(/^[vV]/, "");
    }

    export function parse(versionStr: string): SemVer {

        const match = versionStr.match(/^[vV]?([0-9]+)\.([0-9]+)\.([0-9]+)(?:-beta.([0-9]+))?/);

        if( !match ){
            throw new Error(`${versionStr} is not a valid NPM version`);
        }

        return {
            "major": parseInt(match[1]),
            "minor": parseInt(match[2]),
            "patch": parseInt(match[3])
        };

    };

    /** output do not include v prefix */
    export function stringify(v: SemVer) {
        return `${v.major}.${v.minor}.${v.patch}`;
    }

    /**
     * 
     * v1  <  v2  => -1
     * v1 === v2  => 0
     * v1  >  v2  => 1
     * 
     */
    export function compare(v1: SemVer, v2: SemVer): -1 | 0 | 1 {

        const sign = (n: number): -1 | 0 | 1 => n === 0 ? 0 : (n < 0 ? -1 : 1);

        if (v1.major === v2.major) {
            if (v1.minor === v2.minor) {
                return sign(v1.patch - v2.patch);
            } else {
                return sign(v1.minor - v2.minor);
            }
        } else {
            return sign(v1.major - v2.major);
        }

    }

    export function bumpType(
        params: {
            versionBehindStr: string;
            versionAheadStr: string;
        }
    ): "SAME" | "MAJOR" | "MINOR" | "PATCH" {


        const versionAhead = parse(params.versionAheadStr);
        const versionBehind = parse(params.versionBehindStr);

        if( compare(versionBehind, versionAhead) === 1 ){
            throw new Error(`Version regression ${versionBehind} -> ${versionAhead}`);
        }

        if (versionBehind.major !== versionAhead.major) {

            return "MAJOR";

        } else if (versionBehind.minor !== versionAhead.minor) {

            return "MINOR";

        } else if (versionBehind.patch !== versionAhead.patch) {

            return "PATCH";

        } else {

            return "SAME";

        }

    }

}

