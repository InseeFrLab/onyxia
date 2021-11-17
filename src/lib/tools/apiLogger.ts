import type { ReturnType as TsafeReturnType } from "tsafe/ReturnType";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { Evt } from "evt";
import type { MethodNames } from "tsafe";
import { is } from "tsafe/is";
import { assert } from "tsafe/assert";
import memoize from "memoizee";

export type ApiLogs = {
    evt: NonPostableEvt<{
        type: "cmd" | "result";
        cmdId: number;
        cmdOrResp: string;
    }>;
    history: readonly {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    }[];
};

export type ApiLogger<Api extends Record<string, unknown>> = {
    initialHistory: readonly {
        cmd: string;
        resp: string;
    }[];
    methods: {
        [K in MethodNames<Api>]: {
            buildCmd(...args: Parameters<Api[K]>): string;
            fmtResult(params: {
                inputs: Parameters<Api[K]>;
                result: TsafeReturnType<Api[K]>;
            }): string;
        };
    };
};

export function logApi<Api extends Record<string, unknown>>(params2: {
    api: Api;
    apiLogger: ApiLogger<Api>;
}): {
    apiProxy: Api;
    apiLogs: ApiLogs;
} {
    const { api, apiLogger } = params2;

    const getCounter = (() => {
        let counter = 0;

        return () => counter++;
    })();

    const evt = Evt.create<UnpackEvt<ApiLogs["evt"]>>();

    return {
        "apiProxy": (() => {
            const createMethodProxy = memoize(
                <MethodName extends MethodNames<Api>>(
                    methodName: MethodName,
                ): Api[MethodName] => {
                    const methodProxy = async (inputs: Parameters<Api[MethodName]>) => {
                        const runMethod = () => api[methodName](...inputs);

                        const cmdId = getCounter();

                        const { buildCmd, fmtResult } = apiLogger.methods[methodName];

                        evt.post({
                            cmdId,
                            "type": "cmd",
                            "cmdOrResp": buildCmd(...inputs),
                        });

                        const result = await runMethod();

                        evt.post({
                            cmdId,
                            "type": "result",
                            "cmdOrResp": fmtResult({ inputs, result }),
                        });

                        return result;
                    };

                    return methodProxy as any;
                },
            );

            return new Proxy(api, {
                "get": (...args) => {
                    const [target, propertyKey] = args;

                    if (typeof target !== "function") {
                        return Reflect.get(...args);
                    }

                    assert(is<MethodNames<Api>>(propertyKey));

                    return createMethodProxy(propertyKey);
                },
            });
        })(),
        "apiLogs": (() => {
            const history: ApiLogs["history"][number][] = [
                ...apiLogger.initialHistory.map(rest => ({
                    "cmdId": getCounter(),
                    ...rest,
                })),
            ];

            evt.attach(
                ({ type }) => type === "cmd",
                ({ cmdId, cmdOrResp }) => {
                    history.push({
                        cmdId,
                        "cmd": cmdOrResp,
                        "resp": undefined,
                    });

                    evt.attachOncePrepend(
                        translation => translation.cmdId === cmdId,
                        ({ cmdOrResp }) =>
                            (history.find(entry => entry.cmdId === cmdId)!.resp =
                                cmdOrResp),
                    );
                },
            );

            return { evt, history };
        })(),
    };
}
