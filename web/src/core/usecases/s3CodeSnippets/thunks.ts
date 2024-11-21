import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import type { Technology } from "./state";
import { parseUrl } from "core/tools/parseUrl";
import { privateSelectors } from "./selectors";

export const thunks = {
    /** Can, and must be called before the slice is refreshed,
     * tels if the feature is available.
     */
    isAvailable:
        () =>
        (...args): boolean => {
            const [, getState] = args;
            return privateSelectors.s3Config(getState()) !== undefined;
        },
    /** Refresh is expected to be called whenever the component that use this slice mounts */
    refresh:
        (params: { doForceRenewToken: boolean }) =>
        async (...args) => {
            const { doForceRenewToken } = params;

            const [dispatch, getState] = args;

            if (privateSelectors.isRefreshing(getState())) {
                return;
            }

            dispatch(actions.refreshStarted());

            const s3Config = privateSelectors.s3Config(getState());

            assert(s3Config !== undefined);

            const { region, host, port } = (() => {
                const { host, port = 443 } = parseUrl(
                    s3Config.paramsOfCreateS3Client.url
                );

                const region = s3Config.paramsOfCreateS3Client.region;

                return { region, host, port };
            })();

            const { tokens } = await (async () => {
                const s3Client = await dispatch(
                    s3ConfigManagement.protectedThunks.getS3ClientForSpecificConfig({
                        s3ConfigId: s3Config.id
                    })
                );

                const tokens = await s3Client.getToken({
                    doForceRenew: doForceRenewToken
                });

                assert(tokens !== undefined);

                return { tokens };
            })();

            assert(tokens.sessionToken !== undefined);
            assert(tokens.expirationTime !== undefined);

            dispatch(
                actions.refreshed({
                    credentials: {
                        AWS_ACCESS_KEY_ID: tokens.accessKeyId,
                        AWS_SECRET_ACCESS_KEY: tokens.secretAccessKey,
                        AWS_DEFAULT_REGION: region ?? "",
                        AWS_SESSION_TOKEN: tokens.sessionToken,
                        AWS_S3_ENDPOINT: `${
                            host === "s3.amazonaws.com"
                                ? `s3.${region}.amazonaws.com`
                                : host
                        }${port === 443 ? "" : `:${port}`}`
                    },
                    expirationTime: tokens.expirationTime
                })
            );
        },
    changeTechnology:
        (params: { technology: Technology }) =>
        (...args) => {
            const { technology } = params;
            const [dispatch] = args;
            dispatch(actions.technologyChanged({ technology }));
        }
} satisfies Thunks;
