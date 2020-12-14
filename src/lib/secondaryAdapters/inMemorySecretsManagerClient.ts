

import { join as pathJoin, relative as pathRelative } from "path";
import { partition } from "evt/tools/reducers";
import { SecretWithMetadata, SecretsManagerClient } from "../ports/SecretsManagerClient";
import { assert } from "evt/tools/typeSafety/assert";



function formatPath(path: string): string {
    return pathJoin("/", path).replace(/\/$/, "");
}

export function createInMemorySecretManagerClient(): SecretsManagerClient {

    const map = new Map<string, SecretWithMetadata>();

    return {
        "list": async params => {

            const path = formatPath(params.path);

            assert(!map.has(path), `${path} is a secret not a directory`);

            const [directories, secrets] =
                Array.from(map.keys())
                    .map(key => pathRelative(key, path))
                    .filter(path => !path.startsWith(".."))
                    .reduce(...partition<string>(path => path.split("/").length > 1));

            return {
                "directories": directories.map(path => path.split("/")[0]),
                secrets
            };

        },
        "get": async params => {

            const path = formatPath(params.path);

            assert(map.has(path), `no secret at path ${path}`);

            return map.get(path)!;

        },
        "put": async params => {

            const { secret } = params;

            const path = formatPath(params.path);

            map.set(
                path,
                {
                    secret,
                    "metadata": {
                        "created_time": new Date(),
                        "deletion_time": "",
                        "destroyed": false,
                        "version": !map.has(path) ? 0 : (map.get(path)!.metadata.version + 1)
                    }
                }
            );


        },
        "delete": async params => {

            const path = formatPath(params.path);

            map.delete(path);

        }


    };



}


