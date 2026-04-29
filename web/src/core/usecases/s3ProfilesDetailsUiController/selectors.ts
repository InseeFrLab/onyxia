import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector } from "clean-architecture";
import {
    getCodeSnippet,
    technologies,
    type CodeSnippet,
    type Technology
} from "./decoupledLogic/codeSnippets";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import { assert } from "tsafe";
import { parseUrl } from "core/tools/parseUrl";

const state = (rootState: RootState) => rootState[name];

export type MainView = {
    availableProfileNames: string[];
    profileName: string;
    endpointUrl: string;
    defaultRegion: string | undefined;
    isReadonly: boolean;
    availableTechnologies: readonly Technology[];
    technology: Technology;
    codeSnippet: CodeSnippet;
    accessCredentials:
        | {
              areTokensBeingRenewed: boolean;
              areTokensRenewable: boolean;
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              expirationTime: number | undefined;
          }
        | undefined;
};

const mainView = createSelector(
    state,
    s3ProfilesManagement.selectors.ambientS3Profile,
    createSelector(s3ProfilesManagement.selectors.s3Profiles, s3Profiles =>
        s3Profiles.map(s3Profile => s3Profile.profileName)
    ),
    (state, s3Profile, availableProfileNames): MainView => {
        assert(s3Profile !== undefined);

        const { region, host, port } = (() => {
            const { host, port = 443 } = parseUrl(s3Profile.paramsOfCreateS3Client.url);

            const region = s3Profile.paramsOfCreateS3Client.region;

            return { region, host, port };
        })();

        const endpointUrl = `${
            host === "s3.amazonaws.com" ? `s3.${region}.amazonaws.com` : host
        }${port === 443 ? "" : `:${port}`}`;

        return {
            availableProfileNames,
            profileName: s3Profile.profileName,
            endpointUrl,
            defaultRegion: s3Profile.paramsOfCreateS3Client.region,
            isReadonly: (() => {
                switch (s3Profile.origin) {
                    case "created by user (or group project member)":
                        return false;
                    case "defined in region":
                        return true;
                }
            })(),
            availableTechnologies: technologies,
            accessCredentials:
                state.accessCredentials === undefined
                    ? undefined
                    : {
                          ...state.accessCredentials,
                          areTokensRenewable:
                              s3Profile.paramsOfCreateS3Client.isStsEnabled
                      },
            technology: state.technology,
            codeSnippet: getCodeSnippet({
                accessCredentials: state.accessCredentials,
                defaultRegion: s3Profile.paramsOfCreateS3Client.region,
                endpointUrl: s3Profile.paramsOfCreateS3Client.url,
                profileName: s3Profile.profileName,
                technology: state.technology
            })
        };
    }
);

export const selectors = { mainView };

export const privateSelectors = {
    areTokensBeingRenewed: createSelector(
        state,
        state =>
            state.accessCredentials !== undefined &&
            state.accessCredentials.areTokensBeingRenewed
    )
};
