import type { Thunks } from "core/bootstrap";
import { selectors } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";
import { assert, type Equals } from "tsafe/assert";

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
        }
} satisfies Thunks;
