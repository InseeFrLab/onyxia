
import { join as pathJoin } from "path";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import type { NonPostableEvt, UnpackEvt, StatefulReadonlyEvt } from "evt";
import { Evt } from "evt";
import type { MethodNames } from "evt/tools/typeSafety/MethodNames";

export declare type Secret = { [key: string]: Secret.Value; };

export declare namespace Secret {
    export type Value = string | number | null | Value[] | { [key: string]: Value; };

}

export type SecretWithMetadata = {
    secret: Secret;
    metadata: {
        created_time: Date;
        deletion_time: Date | "";
        destroyed: boolean;
        version: number;

    };
};



export interface VaultClient {


    list(
        params: {
            path: string;
        }
    ): Promise<{
        nodes: string[];
        leafs: string[];
    }>;

    get(
        params: {
            path: string;
        }
    ): Promise<SecretWithMetadata>;

    put(
        params: {
            path: string;
            secret: Secret;
        }
    ): Promise<void>;

    delete(
        params: {
            path: string;
        }
    ): Promise<void>;

    readonly engine: string;
    evtVaultToken: StatefulReadonlyEvt<string | undefined>;


}

function getVaultClientTranslator(
    params: {
        clientType: "CLI",
        engine: string;
    }
): {
        [K in MethodNames<VaultClient>]: {
            buildCmd(...args: Parameters<VaultClient[K]>): string;
            fmtResult(
                params: {
                    inputs: Parameters<VaultClient[K]>;
                    result: AsyncReturnType<VaultClient[K]>;
                }
            ): string;
        }
    } {

    const { clientType, engine } = params;

    switch (clientType) {
        case "CLI":


            return {
                "list": {
                    "buildCmd": (...[{ path }]) =>
                        `vault kv list ${pathJoin(engine, path)}`,
                    "fmtResult": ({ result: { nodes, leafs } }) =>
                        [
                            "Keys",
                            "----",
                            ...[nodes, leafs]
                        ].join("\n")
                },
                "get": {
                    "buildCmd": (...[{ path }]) =>
                        `vault kv get ${pathJoin(engine, path)}`,
                    "fmtResult": ({ result: secretWithMetadata }) => {

                        const n = Math.max(...Object.keys(secretWithMetadata.secret).map(key => key.length)) + 1;

                        return [
                            "==== Data ====",
                            `${"Key".padEnd(n)}Value`,
                            `${"---".padEnd(n)}-----`,
                            ...Object.entries(secretWithMetadata.secret)
                                .map(
                                    ([key, value]) =>
                                        key.padEnd(n) +
                                            typeof value === "string" ? value : JSON.stringify(value)
                                )
                        ].join("\n");

                    }
                },
                "put": {
                    "buildCmd": (...[{ path, secret }]) =>
                        [
                            `vault kv put ${pathJoin(engine, path)}`,
                            ...Object.entries(secret).map(
                                ([key, value]) => `${key}=${typeof value === "string" ?
                                    `"${value.replace(/"/g, '\\"')}"` :
                                    [
                                        "-<<EOF",
                                        `heredoc > ${JSON.stringify(value, null, 2)}`,
                                        "heredoc> EOF"
                                    ].join("\n")
                                    }`
                            )
                        ].join(" \\\n"),
                    "fmtResult": ({ inputs: [{ path }] }) =>
                        `Success! Data written to: ${pathJoin(engine, path)}`
                },
                "delete": {
                    "buildCmd": (...[{ path }]) =>
                        `vault kv delete ${pathJoin(engine, path)}`,
                    "fmtResult": ({ inputs: [{ path }] }) =>
                        `Success! Data deleted (if it existed) at: ${pathJoin(engine, path)}`
                },
            };
    }


}



export function getVaultClientProxyWithTranslator(
    params: {
        vaultClient: VaultClient;
        translateForClientType: Parameters<typeof getVaultClientTranslator>[0]["clientType"]
    }
): {
    vaultClientProxy: VaultClient;
    evtTranslation: NonPostableEvt<{
        type: "cmd" | "result";
        cmdId: number;
        value: string;
    }>;
} {

    const { vaultClient, translateForClientType } = params;

    const getCounter = (() => {

        let counter = 0;

        return () => counter++;

    })();

    const evtTranslation = Evt.create<
        UnpackEvt<
            ReturnType<
                typeof getVaultClientProxyWithTranslator>["evtTranslation"]
        >
    >();

    return {
        "vaultClientProxy": (() => {

            const translator = getVaultClientTranslator({
                "clientType": translateForClientType,
                "engine": vaultClient.engine
            });

            evtTranslation.postAsyncOnceHandled({
                "cmdId": getCounter(),
                "type": "cmd",
                "value": "==> TODO client initialization <=="
            })

            const createMethodProxy = <MethodName extends MethodNames<VaultClient>>(
                _methodName: MethodName
            ): VaultClient[MethodName] => {

                //NOTE: Mitigate type vulnerability.
                const methodName = _methodName as "get";

                const methodProxy = async (...args: Parameters<VaultClient[typeof methodName]>) => {


                    const cmdId = getCounter();

                    const { buildCmd, fmtResult } = translator[methodName];

                    evtTranslation.post({
                        cmdId,
                        "type": "cmd",
                        "value": buildCmd(...args)
                    });

                    const result = await vaultClient[methodName](...args);

                    evtTranslation.post({
                        cmdId,
                        "type": "result",
                        "value": fmtResult({ "inputs": args, result })
                    });

                    return result;

                };

                return methodProxy as any;

            }

            return {
                "list": createMethodProxy("list"),
                "get": createMethodProxy("get"),
                "put": createMethodProxy("put"),
                "delete": createMethodProxy("delete"),
                "engine": vaultClient.engine,
                "evtVaultToken": vaultClient.evtVaultToken
            };

        })(),
        evtTranslation
    };


}





