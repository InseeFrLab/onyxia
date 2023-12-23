import type { Project } from "core/ports/OnyxiaApi";
import type { RestorableConfig } from "core/usecases/restorableConfigManager";
import { assert, type Equals } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";

export type State = {
    projects: Project[];
    selectedProjectId: string;
    currentProjectConfigs: State.ProjectConfigs;
};

export namespace State {
    export type CustomS3Config = {
        url: string;
        region: string;
        workingDirectoryPath: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string | undefined;
        pathStyleAccess: boolean;
    };

    export type ProjectConfigs = {
        servicePassword: string;
        isOnboarded: boolean;
        restorableConfigs: RestorableConfig[];
        customS3Configs: {
            availableConfigs: State.CustomS3Config[];
            indexForXOnyxia: number | undefined;
            indexForExplorer: number | undefined;
        };
    };
}

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof State.ProjectConfigs & keyof userConfigs.UserConfigs, never>>(true);

export const name = "projectManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "projectChanged": (_state, { payload }: { payload: State }) => payload,
        "configValueUpdated": (
            state,
            { payload }: { payload: ChangeConfigValueParams }
        ) => {
            const { key, value } = payload;

            Object.assign(state.currentProjectConfigs, { [key]: value });
        }
    }
});

export type ChangeConfigValueParams<
    K extends keyof State.ProjectConfigs = keyof State.ProjectConfigs
> = {
    key: K;
    value: State.ProjectConfigs[K];
};
