import type { Project } from "core/ports/OnyxiaApi";
import type { FormFieldValue } from "core/usecases/launcher/FormField";
import { assert, type Equals } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";

type State = {
    projects: Project[];
    selectedProjectId: string;
    currentProjectConfigs: ProjectConfigs;
};

export type ProjectConfigs = {
    onboardingTimestamp: number;
    servicePassword: string;
    restorableConfigs: ProjectConfigs.RestorableServiceConfig[];
    s3: {
        customConfigs: ProjectConfigs.CustomS3Config[];
        indexForXOnyxia: number | undefined;
        indexForExplorer: number | undefined;
    };
};

export namespace ProjectConfigs {
    export type CustomS3Config = {
        url: string;
        region: string;
        workingDirectoryPath: string;
        pathStyleAccess: boolean;
        accountFriendlyName: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string | undefined;
    };

    export type RestorableServiceConfig = {
        catalogId: string;
        chartName: string;
        chartVersion: string;
        formFieldsValueDifferentFromDefault: FormFieldValue[];
    };
}

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof ProjectConfigs & keyof userConfigs.UserConfigs, never>>(true);

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
    K extends keyof ProjectConfigs = keyof ProjectConfigs
> = {
    key: K;
    value: ProjectConfigs[K];
};
