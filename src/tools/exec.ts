import * as child_process from "child_process";

/** Same as execSync but async */
export function exec(cmd: string, options?: child_process.ExecOptions): Promise<string> {
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