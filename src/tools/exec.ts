import * as child_process from "child_process";


/** Same as execSync but async */
export function exec(cmd: string, options?: child_process.ExecOptions & { log?: (message: string)=> void;}): Promise<string> {
    options?.log?.(`$ ${cmd} \n cwd: ${options?.cwd ?? process.cwd()}`);
    return new Promise((resolve, reject) =>
        child_process.exec(cmd, { ...(options ?? {}), "encoding": "utf8" }, (error, stdout, stderr) => {
            if (!!error) {
                (error as any)["stderr"] = stderr;

                reject(error);
            } else {
                resolve(stdout as any);
            }
        })
    );
}

export function createLoggedExec(
    params: {
        log: (message: string) => void;
    }
){

    return {
        "exec": (cmd: string, options?: child_process.ExecOptions) => exec(cmd, { ...options, "log": params.log })
    };




}