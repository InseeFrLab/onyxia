import type { Thunks } from "core/bootstrap";
import { selectors, type S3Config } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";
import { assert, type Equals } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { createOidcOrFallback } from "core/adapters/oidc/utils/createOidcOrFallback";
import { createUsecaseContextApi } from "clean-architecture";

export const thunks = {} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const s3Configs = selectors.s3Configs(getState());

            await Promise.all(
                (["s3ConfigId_defaultXOnyxia", "s3ConfigId_explorer"] as const).map(
                    async key => {
                        const s3Config = s3Configs.find(s3Config => {
                            switch (key) {
                                case "s3ConfigId_defaultXOnyxia":
                                    return s3Config.isXOnyxiaDefault;
                                case "s3ConfigId_explorer":
                                    return s3Config.isExplorerConfig;
                            }
                            assert<Equals<typeof key, never>>(false);
                        });

                        if (s3Config === undefined) {
                            return;
                        }

                        await dispatch(
                            projectManagement.protectedThunks.updateConfigValue({
                                key,
                                "value": s3Config.id
                            })
                        );
                    }
                )
            );
        },
    "getS3ClientForSpecificConfig":
        (params: { s3ConfigId: string | undefined }) =>
        async (...args): Promise<S3Client> => {
            const { s3ConfigId } = params;
            const [, getState, rootContext] = args;

            const { s3ClientByConfigId } = getContext(rootContext);

            const s3Config = (() => {
                const s3Configs = selectors.s3Configs(getState());

                const s3Config = s3Configs.find(s3Config => s3Config.id === s3ConfigId);
                assert(s3Config !== undefined);

                return s3Config;
            })();

            use_cached_s3Client: {
                const s3Client = s3ClientByConfigId.get(s3Config.id);

                if (s3Client === undefined) {
                    break use_cached_s3Client;
                }

                return s3Client;
            }

            const { createS3Client } = await import("core/adapters/s3Client");

            const { oidc } = rootContext;

            assert(oidc.isUserLoggedIn);

            const s3Client = createS3Client(s3Config.paramsOfCreateS3Client, oidcParams =>
                createOidcOrFallback({
                    oidcParams,
                    "fallbackOidc": oidc
                })
            );

            s3ClientByConfigId.set(s3Config.id, s3Client);

            return s3Client;
        },
    "getS3ConfigAndClientForExplorer":
        () =>
        async (
            ...args
        ): Promise<undefined | { s3Client: S3Client; s3Config: S3Config }> => {
            const [dispatch, getState] = args;

            const s3Config = selectors
                .s3Configs(getState())
                .find(s3Config => s3Config.isExplorerConfig);

            if (s3Config === undefined) {
                return undefined;
            }

            const s3Client = await dispatch(
                protectedThunks.getS3ClientForSpecificConfig({
                    "s3ConfigId": s3Config.id
                })
            );

            return { s3Client, s3Config };
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "s3ClientByConfigId": new Map<string, S3Client>()
}));
