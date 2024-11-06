import { join as pathJoin, relative as pathRelative } from "pathe";
import { partition } from "evt/tools/reducers/partition";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";
import { SecretWithMetadata, SecretsManager } from "core/ports/SecretsManager";
import { assert } from "tsafe/assert";

createSecretManager.artificialDelayMs = 0;

export function createSecretManager(): SecretsManager {
    const record: { [path: string]: SecretWithMetadata } = (() => {
        const serializedRecord = localStorage.getItem(storageKey);

        return serializedRecord === null ? {} : JSON.parse(serializedRecord);
    })();

    const updateLocalStorage = () =>
        localStorage.setItem(storageKey, JSON.stringify(record));

    const sleep = () =>
        new Promise(resolve =>
            setTimeout(resolve, createSecretManager.artificialDelayMs)
        );

    return {
        list: async params => {
            const path = formatPath(params.path);

            assert(!(path in record), `${path} is a secret not a directory`);

            let [directories, files] = Object.keys(record)
                .map(key => pathRelative(path, key))
                .filter(path => !path.startsWith(".."))
                .reduce(...partition<string>(path => path.split("/").length > 1));

            directories = directories
                .map(path => path.split("/")[0])
                .reduce(...removeDuplicates<string>());

            await sleep();

            return {
                directories: directories.map(path => path.split("/")[0]),
                files
            };
        },
        get: async params => {
            const path = formatPath(params.path);

            assert(path in record, `no secret at path ${path}`);

            await sleep();

            return record[path]!;
        },
        put: async params => {
            const { secret } = params;

            const path = formatPath(params.path);

            record[path] = {
                secret,
                metadata: {
                    created_time: new Date().toISOString(),
                    deletion_time: "",
                    destroyed: false,
                    version: !(path in record) ? 0 : record[path]!.metadata.version + 1
                }
            };

            updateLocalStorage();

            await sleep();
        },
        delete: async params => {
            const path = formatPath(params.path);

            delete record[path];

            updateLocalStorage();

            await sleep();
        },
        getToken: () =>
            Promise.resolve({
                expirationTime: Infinity,
                token: "",
                acquisitionTime: Date.now()
            })
    };
}

function formatPath(path: string): string {
    return pathJoin("/", path).replace(/\/$/, "");
}

const storageKey = "createLocalStorageSecretManagerClient";
