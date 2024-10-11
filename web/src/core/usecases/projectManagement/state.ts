import type { Project } from "core/ports/OnyxiaApi";
import type { FormFieldValue } from "core/usecases/launcher/FormField";
import { assert, type Equals } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import { z } from "zod";
import type { OptionalIfCanBeUndefined } from "core/tools/OptionalIfCanBeUndefined";
import { id } from "tsafe/id";

type State = {
    projects: Project[];
    selectedProjectId: string;
    currentProjectConfigs: ProjectConfigs;
};

export type ProjectConfigs = {
    servicePassword: string;
    restorableConfigs: ProjectConfigs.RestorableServiceConfig[];
    s3: {
        customConfigs: ProjectConfigs.CustomS3Config[];
        indexForXOnyxia: number | undefined;
        indexForExplorer: number | undefined;
    };
    clusterNotificationCheckoutTime: number;
};

export namespace ProjectConfigs {
    export type CustomS3Config = {
        url: string;
        region: string;
        workingDirectoryPath: string;
        pathStyleAccess: boolean;
        accountFriendlyName: string;
        credentials:
            | {
                  accessKeyId: string;
                  secretAccessKey: string;
                  sessionToken: string | undefined;
              }
            | undefined;
    };

    export type RestorableServiceConfig = {
        friendlyName: string;
        isShared: boolean | undefined;
        catalogId: string;
        chartName: string;
        chartVersion: string;
        formFieldsValueDifferentFromDefault: FormFieldValue[];
    };
}

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof ProjectConfigs & keyof userConfigs.UserConfigs, never>>(true);

export const { zProjectConfigs } = (() => {
    const zFormFieldValueValue = (() => {
        type TargetType =
            ProjectConfigs.RestorableServiceConfig["formFieldsValueDifferentFromDefault"][number]["value"];

        const zTargetType = z.union([
            z.string(),
            z.boolean(),
            z.number(),
            z.object({
                "type": z.literal("yaml"),
                "yamlStr": z.string()
            })
        ]);

        assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zFormFieldValue = (() => {
        type TargetType =
            ProjectConfigs.RestorableServiceConfig["formFieldsValueDifferentFromDefault"][number];

        const zTargetType = z.object({
            path: z.array(z.string()),
            value: zFormFieldValueValue
        });

        assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zRestorableServiceConfig = (() => {
        type TargetType = ProjectConfigs.RestorableServiceConfig;

        const zTargetType = z.object({
            friendlyName: z.string(),
            isShared: z.union([z.boolean(), z.undefined()]),
            catalogId: z.string(),
            chartName: z.string(),
            chartVersion: z.string(),
            formFieldsValueDifferentFromDefault: z.array(zFormFieldValue)
        });

        assert<
            Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>
        >();

        // @ts-expect-error
        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zS3Credentials = (() => {
        type TargetType = Exclude<
            ProjectConfigs.CustomS3Config["credentials"],
            undefined
        >;

        const zTargetType = z.object({
            accessKeyId: z.string(),
            secretAccessKey: z.string(),
            sessionToken: z.union([z.string(), z.undefined()])
        });

        assert<
            Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>
        >();

        // @ts-expect-error
        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zCustomS3Config = (() => {
        type TargetType = ProjectConfigs.CustomS3Config;

        const zTargetType = z.object({
            url: z.string(),
            region: z.string(),
            workingDirectoryPath: z.string(),
            pathStyleAccess: z.boolean(),
            accountFriendlyName: z.string(),
            credentials: z.union([zS3Credentials, z.undefined()])
        });

        assert<
            Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>
        >();

        // @ts-expect-error
        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zS3 = (() => {
        type TargetType = ProjectConfigs["s3"];

        const zTargetType = z.object({
            customConfigs: z.array(zCustomS3Config),
            indexForXOnyxia: z.union([z.number(), z.undefined()]),
            indexForExplorer: z.union([z.number(), z.undefined()])
        });

        assert<
            Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>
        >();

        // @ts-expect-error
        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    const zProjectConfigs = (() => {
        type TargetType = ProjectConfigs;

        const zTargetType = z.object({
            servicePassword: z.string(),
            restorableConfigs: z.array(zRestorableServiceConfig),
            s3: zS3,
            clusterNotificationCheckoutTime: z.number()
        });

        assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

        return id<z.ZodType<TargetType>>(zTargetType);
    })();

    return { zProjectConfigs };
})();

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
