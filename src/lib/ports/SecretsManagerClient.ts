
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import type { NonPostableEvt } from "evt";
import { Evt } from "evt";
import type { MethodNames } from "evt/tools/typeSafety/MethodNames";

export declare type Secret = { [key: string]: Secret.Value; };

export declare namespace Secret {
    export type Value = string | boolean | number | null | Value[] | { [key: string]: Value; };

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



export interface SecretsManagerClient {


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

}

export type VaultClientTranslator = {
        [K in MethodNames<SecretsManagerClient>]: {
            buildCmd(...args: Parameters<SecretsManagerClient[K]>): string;
            fmtResult(
                params: {
                    inputs: Parameters<SecretsManagerClient[K]>;
                    result: AsyncReturnType<SecretsManagerClient[K]>;
                }
            ): string;
        }
};


export type Translation = {
        type: "cmd" | "result";
        cmdId: number;
        value: string;
};

export function getVaultClientProxyWithTranslator(
    params: {
        secretsManagerClient: SecretsManagerClient;
        vaultClientTranslator: VaultClientTranslator;
    }
): {
    secretsManagerClientProxy: SecretsManagerClient;
    evtTranslation: NonPostableEvt<Translation>;
} {

    const { secretsManagerClient, vaultClientTranslator } = params;

    const getCounter = (() => {

        let counter = 0;

        return () => counter++;

    })();

    const evtTranslation = Evt.create<Translation>();

    return {
        "secretsManagerClientProxy": (() => {


            evtTranslation.postAsyncOnceHandled({
                "cmdId": getCounter(),
                "type": "cmd",
                "value": "==> TODO client initialization <=="
            })

            const createMethodProxy = <MethodName extends MethodNames<SecretsManagerClient>>(
                _methodName: MethodName
            ): SecretsManagerClient[MethodName] => {

                //NOTE: Mitigate type vulnerability.
                const methodName = _methodName as "get";

                const methodProxy = async (...args: Parameters<SecretsManagerClient[typeof methodName]>) => {


                    const cmdId = getCounter();

                    const { buildCmd, fmtResult } = vaultClientTranslator[methodName];

                    evtTranslation.post({
                        cmdId,
                        "type": "cmd",
                        "value": buildCmd(...args)
                    });

                    const result = await secretsManagerClient[methodName](...args);

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
                "delete": createMethodProxy("delete")
            };

        })(),
        evtTranslation
    };


}


