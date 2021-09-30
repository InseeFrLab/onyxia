import type { ReturnType as TsafeReturnType } from "tsafe/ReturnType";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { Evt } from "evt";
import type { Param0, MethodNames } from "tsafe";

export declare type Secret = { [key: string]: Secret.Value };

export declare namespace Secret {
    export type Value =
        | string
        | boolean
        | number
        | null
        | Value[]
        | { [key: string]: Value };
}

export type SecretWithMetadata = {
    secret: Secret;
    metadata: {
        created_time: string;
        deletion_time: string | "";
        destroyed: boolean;
        version: number;
    };
};

export type SecretsManagerClient = {
    list: (params: { path: string }) => Promise<{
        directories: string[];
        secrets: string[];
    }>;

    get: (params: { path: string }) => Promise<SecretWithMetadata>;

    put: (params: { path: string; secret: Secret }) => Promise<void>;

    delete: (params: { path: string }) => Promise<void>;

    getToken: () => Promise<{
        token: string;
        expirationTime: number;
    }>;
};

export type SecretsManagerTranslator = {
    initialHistory: readonly {
        cmd: string;
        resp: string;
    }[];
    methods: {
        [K in MethodNames<SecretsManagerClient>]: {
            buildCmd(...args: Parameters<SecretsManagerClient[K]>): string;
            fmtResult(params: {
                inputs: Parameters<SecretsManagerClient[K]>;
                result: TsafeReturnType<SecretsManagerClient[K]>;
            }): string;
        };
    };
};

export type SecretsManagerTranslations = {
    evt: NonPostableEvt<{
        type: "cmd" | "result";
        cmdId: number;
        translation: string;
    }>;
    history: readonly {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    }[];
};

export function observeSecretsManagerClientWithTranslator(params: {
    secretsManagerClient: SecretsManagerClient;
    secretsManagerTranslator: SecretsManagerTranslator;
}): {
    secretsManagerClientProxy: SecretsManagerClient;
    secretsManagerTranslations: SecretsManagerTranslations;
} {
    const { secretsManagerClient, secretsManagerTranslator } = params;

    const getCounter = (() => {
        let counter = 0;

        return () => counter++;
    })();

    const evt = Evt.create<UnpackEvt<SecretsManagerTranslations["evt"]>>();

    return {
        "secretsManagerTranslations": (() => {
            const history: SecretsManagerTranslations["history"][number][] = [
                ...secretsManagerTranslator.initialHistory.map(rest => ({
                    "cmdId": getCounter(),
                    ...rest,
                })),
            ];

            evt.attach(
                ({ type }) => type === "cmd",
                ({ cmdId, translation }) => {
                    history.push({
                        cmdId,
                        "cmd": translation,
                        "resp": undefined,
                    });

                    evt.attachOncePrepend(
                        translation => translation.cmdId === cmdId,
                        ({ translation }) =>
                            (history.find(entry => entry.cmdId === cmdId)!.resp =
                                translation),
                    );
                },
            );

            return { evt, history };
        })(),
        "secretsManagerClientProxy": (() => {
            const createMethodProxy = <
                MethodName extends MethodNames<SecretsManagerClient>,
            >(
                _methodName: MethodName,
            ): SecretsManagerClient[MethodName] => {
                //NOTE: Mitigate type vulnerability.
                const methodName = _methodName as "get";

                const methodProxy = async ({
                    doLogCommandToTranslator,
                    ...params
                }: Param0<SecretsManagerClient[typeof methodName]> & {
                    doLogCommandToTranslator: boolean;
                }) => {
                    const runMethod = () => secretsManagerClient[methodName](params);

                    if (!doLogCommandToTranslator) {
                        return runMethod();
                    }

                    const cmdId = getCounter();

                    const { buildCmd, fmtResult } =
                        secretsManagerTranslator.methods[methodName];

                    evt.post({
                        cmdId,
                        "type": "cmd",
                        "translation": buildCmd(params),
                    });

                    const result = await runMethod();

                    evt.post({
                        cmdId,
                        "type": "result",
                        "translation": fmtResult({ "inputs": [params], result }),
                    });

                    return result;
                };

                return methodProxy as any;
            };

            const out = {
                "list": createMethodProxy("list"),
                "get": createMethodProxy("get"),
                "put": createMethodProxy("put"),
                "delete": createMethodProxy("delete"),
                "getToken": createMethodProxy("getToken"),
            };

            return out;
        })(),
    };
}
