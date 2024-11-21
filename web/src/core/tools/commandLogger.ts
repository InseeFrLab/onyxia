import type { NonPostableEvt, UnpackEvt } from "evt";
import { Evt } from "evt";
import type {
    MethodNames,
    ReturnType as TsafeReturnType,
    Parameters as TsafeParameters
} from "tsafe";
import { assert, is } from "tsafe/assert";
import memoize from "memoizee";

export type CommandLogs = {
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

type Parameters<T> = T extends (...args: any) => any ? TsafeParameters<T> : never;
type ReturnType<T> = T extends (...args: any) => any ? TsafeReturnType<T> : never;

export type CommandLogger<Api extends Record<string, unknown>> = {
    initialHistory: readonly {
        cmd: string;
        resp: string;
    }[];
    methods: {
        [K in MethodNames<Api>]: {
            buildCmd: (...args: Parameters<Api[K]>) => string;
            fmtResult: (params: {
                inputs: Parameters<Api[K]>;
                result: ReturnType<Api[K]>;
            }) => string;
        };
    };
};

export function logApi<Api extends Record<string, unknown>>(params2: {
    api: Api;
    commandLogger: CommandLogger<Api>;
}): {
    loggedApi: Api;
    commandLogs: CommandLogs;
} {
    const { api, commandLogger } = params2;

    const getCounter = (() => {
        let counter = 0;

        return () => counter++;
    })();

    const evt = Evt.create<UnpackEvt<CommandLogs["evt"]>>();

    return {
        loggedApi: (() => {
            const createMethodProxy = memoize(
                <MethodName extends MethodNames<Api>>(
                    methodName: MethodName
                ): Api[MethodName] => {
                    const methodProxy = async (
                        ...inputs: Parameters<Api[MethodName]>
                    ) => {
                        const runMethod = () =>
                            (api[methodName] as any)(...(inputs as any));

                        const cmdId = getCounter();

                        const { buildCmd, fmtResult } = commandLogger.methods[methodName];

                        evt.post({
                            cmdId,
                            type: "cmd",
                            cmdOrResp: buildCmd(...inputs)
                        });

                        const result = await runMethod();

                        evt.post({
                            cmdId,
                            type: "result",
                            cmdOrResp: fmtResult({ inputs, result })
                        });

                        return result;
                    };

                    return methodProxy as any;
                }
            );

            return new Proxy(api, {
                get: (...args) => {
                    const [, propertyKey] = args;

                    if (!(propertyKey in commandLogger.methods)) {
                        return Reflect.get(...args);
                    }

                    assert(is<MethodNames<Api>>(propertyKey));

                    return createMethodProxy(propertyKey);
                }
            });
        })(),
        commandLogs: (() => {
            const history: CommandLogs["history"][number][] = [
                ...commandLogger.initialHistory.map(rest => ({
                    cmdId: getCounter(),
                    ...rest
                }))
            ];

            evt.attach(
                ({ type }) => type === "cmd",
                ({ cmdId, cmdOrResp }) => {
                    history.push({
                        cmdId,
                        cmd: cmdOrResp,
                        resp: undefined
                    });

                    evt.attachOncePrepend(
                        translation => translation.cmdId === cmdId,
                        ({ cmdOrResp }) =>
                            (history.find(entry => entry.cmdId === cmdId)!.resp =
                                cmdOrResp)
                    );
                }
            );

            return { evt, history };
        })()
    };
}
