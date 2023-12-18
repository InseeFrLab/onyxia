import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { join as pathJoin } from "path";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { actions, name, type State, type ChangeConfigValueParams } from "./state";
import type { Secret } from "core/ports/SecretsManager";
import { privateSelectors, selectors } from "./selectors";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { Mutex } from "async-mutex";
import { same } from "evt/tools/inDepth";
import { Deferred } from "evt/tools/Deferred";

export const thunks = {
    "renewServicePassword":
        () =>
        async (...args) => {
            const [dispatch] = args;
            await dispatch(
                protectedThunks.updateValue({
                    "key": "servicePassword",
                    "value": generateRandomPassword()
                })
            );
        }
} satisfies Thunks;

const keys = [
    "servicePassword",
    "isOnboarded",
    "restorableConfigs",
    "customS3Configs"
] as const;

assert<Equals<(typeof keys)[number], keyof State>>();

export const privateThunks = {
    "getRemoteValue":
        <K extends keyof State>(params: { key: K }) =>
        async (...args): Promise<State[K]> => {
            const { key } = params;

            const [, getState, rootContext] = args;

            const { secretsManager } = rootContext;

            const path = pathJoin(privateSelectors.dirPath(getState()), key);

            let value = await secretsManager
                .get({ path })
                .then(({ secret }) => secretToValue(secret) as State[K])
                .catch(cause => new Error(String(cause), { cause }));

            if (value instanceof Error) {
                value = getDefaultConfig(key);

                const { mutexByKey } = getContext(rootContext);

                await mutexByKey[key].runExclusive(async () =>
                    secretsManager.put({
                        path,
                        "secret": valueToSecret(value)
                    })
                );
            }

            return value;
        },
    "getRemoteValues":
        () =>
        async (...args): Promise<State> => {
            const [dispatch] = args;

            return Object.fromEntries(
                await Promise.all(
                    keys.map(key =>
                        dispatch(privateThunks.getRemoteValue({ key })).then(
                            value => [key, value] as const
                        )
                    )
                )
            ) as any;
        },
    "__migration":
        () =>
        async (...args) => {
            const [, getState, { secretsManager }] = args;

            restorableConfigsStr: {
                const dirPath = privateSelectors.dirPath(getState());

                const path = pathJoin(dirPath, "restorableConfigsStr");

                const value = await secretsManager
                    .get({ path })
                    .then(({ secret }) => secret.value as string)
                    .catch(cause => new Error(String(cause), { cause }));

                if (value instanceof Error) {
                    break restorableConfigsStr;
                }

                await secretsManager.delete({ path });

                await secretsManager.put({
                    "path": pathJoin(dirPath, "restorableConfigs"),
                    "secret": valueToSecret(JSON.parse(value))
                });
            }
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { evtAction, onyxiaApi }] = args;

            const dInitializationDone = new Deferred<void>();

            evtAction
                .pipe(
                    data =>
                        data.usecaseName === "projectSelection" &&
                        data.actionName === "projectChanged"
                )
                .toStateful()
                .attach(async () => {
                    dispatch(privateThunks.__migration());

                    dispatch(
                        actions.projectChanged(
                            await dispatch(privateThunks.getRemoteValues())
                        )
                    );

                    dInitializationDone.resolve();

                    onboarding: {
                        const rootState = getState();

                        const { isOnboarded } =
                            selectors.selectedProjectConfigs(rootState);

                        if (isOnboarded) {
                            break onboarding;
                        }

                        await onyxiaApi.onboard();
                    }
                });

            return dInitializationDone.pr;
        },
    "updateValue":
        <K extends keyof State>(params: ChangeConfigValueParams<K>) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { mutexByKey } = getContext(rootContext);

            const { secretsManager } = rootContext;

            await mutexByKey[params.key].runExclusive(async () => {
                const currentLocalValue = getState()[name][params.key];

                if (same(currentLocalValue, params.value)) {
                    return;
                }

                dispatch(actions.updated(params));

                const currentRemoteValue = await dispatch(
                    privateThunks.getRemoteValue({ "key": params.key })
                );

                if (!same(currentLocalValue, currentLocalValue)) {
                    alert(
                        [
                            `Someone in the group has updated the value of ${params.key} to`,
                            `${JSON.stringify(currentRemoteValue)}, reloading the page...`
                        ].join(" ")
                    );
                    window.location.reload();
                    return;
                }

                await secretsManager.put({
                    "path": pathJoin(privateSelectors.dirPath(getState()), params.key),
                    "secret": valueToSecret(params.value)
                });
            });
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "mutexByKey": Object.fromEntries(keys.map(key => [key, new Mutex()])) as Record<
        keyof State,
        Mutex
    >
}));

function getDefaultConfig<K extends keyof State>(key_: K): State[K] {
    const key = key_ as keyof State;
    switch (key) {
        case "servicePassword": {
            const out: State[typeof key] = generateRandomPassword();
            // @ts-expect-error
            return out;
        }
        case "isOnboarded": {
            const out: State[typeof key] = false;
            // @ts-expect-error
            return out;
        }
        case "restorableConfigs": {
            const out: State[typeof key] = [];
            // @ts-expect-error
            return out;
        }
        case "customS3Configs": {
            const out: State[typeof key] = {
                "availableConfigs": [],
                "indexForExplorer": undefined,
                "indexForXOnyxia": undefined
            };
            // @ts-expect-error
            return out;
        }
    }
    assert<Equals<typeof key, never>>(false);
}

function valueToSecret(value: any): Secret {
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return { "value": value };
    }

    if (value === undefined) {
        return {};
    }

    return { "valueAsJson": JSON.stringify(value) };
}

function secretToValue(secret: Secret): unknown {
    const [key, ...otherKeys] = Object.keys(secret);

    assert(
        (key === undefined || key === "value" || key === "valueAsJson") &&
            otherKeys.length === 0,
        `project config secret should have only one key, either "value" or "valueAsJson", got ${JSON.stringify(
            secret
        )}`
    );

    switch (key) {
        case undefined:
            return undefined;
        case "value":
            return secret[key];
        case "valueAsJson": {
            const valueStr = secret[key];

            assert(typeof valueStr === "string");

            return JSON.parse(valueStr);
        }
    }
}
