import type { Thunks } from "core/bootstrap";
import { assert, is, type Equals } from "tsafe/assert";
import { actions, type State } from "./state";
import { privateSelectors } from "./selectors";
import { createUsecaseContextApi } from "clean-architecture";
import {
    computeHelmValues,
    type FormFieldValue
} from "core/usecases/launcher/decoupledLogic";
import * as userConfigs from "core/usecases/userConfigs";
import { zStringifyable } from "core/tools/Stringifyable";
import * as launcher from "core/usecases/launcher";
import { z } from "zod";
import { id } from "tsafe/id";

export const thunks = {
    getIsEnabled:
        () =>
        (...args) => {
            const [, , rootContext] = args;

            // NOTE: This is so that we can access the xOnyxia before this usecase is initialized
            if (!getIsContextSet(rootContext)) {
                return false;
            }

            const { isEnabled } = getContext(rootContext);

            return isEnabled;
        },
    changeFormFieldValue:
        (params: FormFieldValue) =>
        (...args) => {
            const [dispatch, getState] = args;
            const formFieldValue = params;

            const rootForm = privateSelectors.rootForm(getState());

            assert(rootForm !== null);

            dispatch(actions.formFieldValueChanged({ formFieldValue, rootForm }));
        },
    addArrayItem:
        (params: { valuesPath: (string | number)[] }) =>
        (...args) => {
            const { valuesPath } = params;

            const [dispatch] = args;

            dispatch(actions.arrayItemAdded({ valuesPath }));
        },
    removeArrayItem:
        (params: { valuesPath: (string | number)[]; index: number }) =>
        (...args) => {
            const { valuesPath, index } = params;

            const [dispatch] = args;

            dispatch(actions.arrayItemRemoved({ valuesPath, index }));
        },
    onIsAutoInjectedChange:
        (params: { valuesPath: (string | number)[]; isAutoInjected: boolean }) =>
        (...args) => {
            const { valuesPath, isAutoInjected } = params;

            const [dispatch] = args;

            dispatch(
                actions.autoInjectedChanged({
                    valuesPath,
                    isAutoInjected
                })
            );
        },
    restore:
        () =>
        async (...args) => {
            const [dispatch] = args;

            dispatch(actions.restored());
        },
    save:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            await dispatch(
                userConfigs.thunks.changeValue({
                    key: "userProfileStr",
                    value: JSON.stringify(privateSelectors.userProfile(getState()))
                })
            );

            dispatch(actions.saved());
        }
} satisfies Thunks;

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<{
    isEnabled: boolean;
}>();

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { onyxiaApi } = rootContext;

            const schema = await onyxiaApi.getUserProfileJsonSchema();

            if (schema === undefined) {
                setContext(rootContext, { isEnabled: false });

                return;
            }

            const {
                helmValues: userProfileValues_default,
                helmValuesSchema_forDataTextEditor: schema_allPropertiesRequired
            } = computeHelmValues({
                helmValuesSchema: schema,
                xOnyxiaContext: await dispatch(
                    launcher.protectedThunks.getXOnyxiaContext({
                        doInjectPersonalInfos: true,
                        s3ConfigId: undefined
                    })
                ),
                helmValuesYaml: "{}",
                infoAmountInHelmValues: "user provided"
            });

            const userProfile_stored = await (async () => {
                const { userProfileStr } = userConfigs.selectors.userConfigs(getState());

                if (userProfileStr === null) {
                    return undefined;
                }

                let userProfile: unknown;

                try {
                    userProfile = JSON.parse(userProfileStr);
                } catch (error) {
                    assert(is<Error>(error));
                    return error;
                }

                const zUserProfile = (() => {
                    type TargetType = State.UserProfile;

                    const zTargetType = z.object({
                        userProfileValues: z.record(z.string(), zStringifyable),
                        autoInjectionDisabledFields: z.array(
                            z.object({
                                valuesPath: z.array(z.union([z.string(), z.number()]))
                            })
                        )
                    });

                    type InferredType = z.infer<typeof zTargetType>;

                    assert<Equals<TargetType, InferredType>>;

                    return id<z.ZodType<TargetType>>(zTargetType);
                })();

                try {
                    zUserProfile.parse(userProfile);
                } catch (error) {
                    assert(is<Error>(error));
                    return error;
                }

                assert(is<State.UserProfile>(userProfile));

                const { Ajv } = await import("ajv");

                const ajv = new Ajv({ strict: false });

                const ajvValidateFunction = ajv.compile(schema_allPropertiesRequired);

                const isValid = ajvValidateFunction(userProfile.userProfileValues);

                if (!isValid) {
                    return new Error("Saved user profile does not match the schema");
                }

                return userProfile;
            })();

            if (userProfile_stored instanceof Error) {
                const error = userProfile_stored;

                console.warn(error.message);

                await dispatch(
                    userConfigs.thunks.changeValue({
                        key: "userProfileStr",
                        value: null
                    })
                );
            }

            const userProfile = (() => {
                if (
                    userProfile_stored === undefined ||
                    userProfile_stored instanceof Error
                ) {
                    return id<State.UserProfile>({
                        userProfileValues: userProfileValues_default,
                        autoInjectionDisabledFields: []
                    });
                }

                return userProfile_stored;
            })();

            dispatch(
                actions.initialized({
                    schema,
                    userProfile
                })
            );

            setContext(rootContext, { isEnabled: true });
        }
} satisfies Thunks;
