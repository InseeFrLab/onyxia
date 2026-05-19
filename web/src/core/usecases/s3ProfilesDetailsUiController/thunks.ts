import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import { privateSelectors } from "./selectors";
import type { Technology } from "./decoupledLogic/codeSnippets";

export const thunks = {
    load:
        () =>
        async (...args) => {
            const [dispatch] = args;

            const s3ClientWrap = await dispatch(
                s3ProfilesManagement.protectedThunks.getAmbientS3ProfileAndClient()
            );

            assert(s3ClientWrap !== undefined);

            const { s3Client } = s3ClientWrap;

            const tokens = await s3Client.getToken({ doForceRenew: false });

            dispatch(
                actions.loaded({
                    accessCredentials:
                        tokens === undefined
                            ? undefined
                            : {
                                  accessKeyId: tokens.accessKeyId,
                                  expirationTime: tokens.expirationTime,
                                  secretAccessKey: tokens.secretAccessKey,
                                  sessionToken: tokens.sessionToken
                              }
                })
            );
        },
    renewTokens:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            if (privateSelectors.areTokensBeingRenewed(getState())) {
                return;
            }

            dispatch(actions.tokenRenewalStarted());

            const s3ClientWrap = await dispatch(
                s3ProfilesManagement.protectedThunks.getAmbientS3ProfileAndClient()
            );

            assert(s3ClientWrap !== undefined);

            const { s3Client } = s3ClientWrap;

            const tokens = await s3Client.getToken({ doForceRenew: true });

            assert(tokens !== undefined);
            assert(tokens.expirationTime !== undefined);

            dispatch(
                actions.tokenRenewed({
                    accessKeyId: tokens.accessKeyId,
                    expirationTime: tokens.expirationTime,
                    secretAccessKey: tokens.secretAccessKey,
                    sessionToken: tokens.sessionToken
                })
            );
        },
    changeTechnology:
        (params: { technology: Technology }) =>
        (...args) => {
            const { technology } = params;
            const [dispatch] = args;
            dispatch(actions.technologyChanged({ technology }));
        },
    updateSelectedS3Profile:
        (params: { profileName: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { profileName } = params;

            const { doesProfileExist } = dispatch(
                s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                    profileName
                })
            );

            assert(doesProfileExist);

            await dispatch(thunks.load());
        }
} satisfies Thunks;
