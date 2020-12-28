
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import type { NonPostableEvt } from "evt";
import { Evt } from "evt";
import type { MethodNames } from "evt/tools/typeSafety/MethodNames";

export declare type Secret = { [key: string]: Secret.Value; };

export declare namespace Secret {
    //TODO: Restore the real definition once TS 4.x will be supported by CRA
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

export type SecretsManagerClient = {

    list(
        params: {
            path: string;
        }
    ): Promise<{
        directories: string[];
        secrets: string[];
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

};

export type SecretsManagerTranslator = {
    initialization: {
        cmd: string;
        result: string;
    }[];
    methods: {
        [K in MethodNames<SecretsManagerClient>]: {
            buildCmd(...args: Parameters<SecretsManagerClient[K]>): string;
            fmtResult(
                params: {
                    inputs: Parameters<SecretsManagerClient[K]>;
                    result: AsyncReturnType<SecretsManagerClient[K]>;
                }
            ): string;
        };
    }
};


export type SecretsManagerTranslation = {
    type: "cmd" | "result";
    cmdId: number;
    translation: string;
    isForInitialization: boolean;
};

export function observeSecretsManagerClientWithTranslater(
    params: {
        secretsManagerClient: SecretsManagerClient;
        secretsManagerTranslator: SecretsManagerTranslator;
    }
): {
    secretsManagerClientProxy: SecretsManagerClient;
    evtSecretsManagerTranslation: NonPostableEvt<SecretsManagerTranslation>;
} {

    const {
        secretsManagerClient,
        secretsManagerTranslator
    } = params;

    const getCounter = (() => {

        let counter = 0;

        return () => counter++;

    })();

    const evtSecretsManagerTranslation = Evt.create<SecretsManagerTranslation>();

    return {
        "secretsManagerClientProxy": (() => {

            (async () => {

                const isForInitialization = true;

                const [first, ...rest] = secretsManagerTranslator.initialization
                    .reduce<SecretsManagerTranslation[]>((prev, { cmd, result }) => {

                        const cmdId = getCounter();

                        return [
                            ...prev,
                            {
                                cmdId,
                                "type": "cmd",
                                "translation": cmd,
                                isForInitialization
                            },
                            {
                                cmdId,
                                "type": "result",
                                "translation": result,
                                isForInitialization
                            },
                        ];

                    }, []);

                await evtSecretsManagerTranslation.postAsyncOnceHandled(first);

                rest.forEach(data => evtSecretsManagerTranslation.post(data));

            })();

            const createMethodProxy = <MethodName extends MethodNames<SecretsManagerClient>>(
                _methodName: MethodName
            ): SecretsManagerClient[MethodName] => {

                const isForInitialization = false;

                //NOTE: Mitigate type vulnerability.
                const methodName = _methodName as "get";

                const methodProxy = async (...args: Parameters<SecretsManagerClient[typeof methodName]>) => {

                    const cmdId = getCounter();

                    const { buildCmd, fmtResult } = secretsManagerTranslator.methods[methodName];

                    evtSecretsManagerTranslation.post({
                        cmdId,
                        "type": "cmd",
                        "translation": buildCmd(...args),
                        isForInitialization
                    });

                    const result = await secretsManagerClient[methodName](...args);

                    evtSecretsManagerTranslation.post({
                        cmdId,
                        "type": "result",
                        "translation": fmtResult({ "inputs": args, result }),
                        isForInitialization
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
        evtSecretsManagerTranslation
    };


}


