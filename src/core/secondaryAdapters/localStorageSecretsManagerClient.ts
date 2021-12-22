import { join as pathJoin, relative as pathRelative } from "path";
import { partition } from "evt/tools/reducers/partition";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";
import { SecretWithMetadata, SecretsManagerClient } from "../ports/SecretsManagerClient";
import { assert } from "tsafe/assert";
import { symToStr } from "tsafe/symToStr";

function formatPath(path: string): string {
    return pathJoin("/", path).replace(/\/$/, "");
}

export function createLocalStorageSecretManagerClient(params: {
    artificialDelayMs: number;
    doReset: boolean;
}): SecretsManagerClient {
    const { artificialDelayMs, doReset } = params;

    if (doReset) {
        localStorage.removeItem(storageKey);
    }

    const record: { [path: string]: SecretWithMetadata } = (() => {
        const serializedRecord = localStorage.getItem(storageKey);

        return serializedRecord === null ? {} : JSON.parse(serializedRecord);
    })();

    const updateLocalStorage = () =>
        localStorage.setItem(storageKey, JSON.stringify(record));

    const sleep = () => new Promise(resolve => setTimeout(resolve, artificialDelayMs));

    return {
        "list": async params => {
            const path = formatPath(params.path);

            assert(!(path in record), `${path} is a secret not a directory`);

            let [directories, secrets] = Object.keys(record)
                .map(key => pathRelative(path, key))
                .filter(path => !path.startsWith(".."))
                .reduce(...partition<string>(path => path.split("/").length > 1));

            directories = directories
                .map(path => path.split("/")[0])
                .reduce(...removeDuplicates<string>());

            await sleep();

            return {
                "directories": directories.map(path => path.split("/")[0]),
                secrets,
            };
        },
        "get": async params => {
            const path = formatPath(params.path);

            assert(path in record, `no secret at path ${path}`);

            await sleep();

            return record[path]!;
        },
        "put": async params => {
            const { secret } = params;

            const path = formatPath(params.path);

            record[path] = {
                secret,
                "metadata": {
                    "created_time": new Date().toISOString(),
                    "deletion_time": "",
                    "destroyed": false,
                    "version": !(path in record) ? 0 : record[path]!.metadata.version + 1,
                },
            };

            updateLocalStorage();

            await sleep();
        },
        "delete": async params => {
            const path = formatPath(params.path);

            delete record[path];

            updateLocalStorage();

            await sleep();
        },
        "getToken": () =>
            Promise.resolve({
                "expirationTime": Infinity,
                "token": "",
                "acquisitionTime": Date.now(),
            }),
    };
}

const storageKey = symToStr({ createLocalStorageSecretManagerClient });
