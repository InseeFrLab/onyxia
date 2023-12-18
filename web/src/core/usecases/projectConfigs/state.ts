import type { RestorableConfig } from "core/usecases/restorableConfigManager";
import { assert, type Equals } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";

export type State = {
    servicePassword: string;
    isOnboarded: boolean;
    restorableConfigs: RestorableConfig[];
    customS3Configs: {
        availableConfigs: State.CustomS3Config[];
        indexForXOnyxia: number | undefined;
        indexForExplorer: number | undefined;
    };
};

export namespace State {
    export type CustomS3Config = {
        url: string;
        region: string;
        rootDirPath: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string | undefined;
    };
}

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof State & keyof userConfigs.UserConfigs, never>>(true);

export const name = "projectConfigs";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "projectChanged": (_state, { payload }: { payload: State }) => payload,
        "updated": (state, { payload }: { payload: ChangeConfigValueParams }) => {
            const { key, value } = payload;

            Object.assign(state, { [key]: value });
        }
    }
});

export type ChangeConfigValueParams<K extends keyof State = keyof State> = {
    key: K;
    value: State[K];
};
