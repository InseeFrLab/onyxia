import type { Thunks } from "core/bootstrap";
import { assert, is } from "tsafe/assert";
import { actions } from "./state";
import { privateSelectors, protectedSelectors } from "./selectors";
import { createUsecaseContextApi } from "clean-architecture";
import {
    computeHelmValues,
    type FormFieldValue
} from "core/usecases/launcher/decoupledLogic";
import * as userConfigs from "core/usecases/userConfigs";
import type { Stringifyable } from "core/tools/Stringifyable";
import * as launcher from "core/usecases/launcher";

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
                    key: "userProfileValuesStr",
                    value: JSON.stringify(protectedSelectors.values(getState()))
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
                helmValues: values_default,
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

            const values_stored = await (async () => {
                const { userProfileValuesStr } =
                    userConfigs.selectors.userConfigs(getState());

                if (userProfileValuesStr === null) {
                    return undefined;
                }

                let values: Record<string, Stringifyable>;

                try {
                    values = JSON.parse(userProfileValuesStr);
                } catch (error) {
                    assert(is<Error>(error));
                    return error;
                }

                const { Ajv } = await import("ajv");

                const ajv = new Ajv({ strict: false });

                const ajvValidateFunction = ajv.compile(schema_allPropertiesRequired);

                const isValid = ajvValidateFunction(values);

                if (!isValid) {
                    return new Error("Saved user profile does not match the schema");
                }

                assert(is<Record<string, Stringifyable>>(values));

                return values;
            })();

            if (values_stored instanceof Error) {
                const error = values_stored;

                console.warn(error.message);

                await dispatch(
                    userConfigs.thunks.changeValue({
                        key: "userProfileValuesStr",
                        value: null
                    })
                );
            }

            const values = (() => {
                if (values_stored === undefined || values_stored instanceof Error) {
                    return values_default;
                }

                return values_stored;
            })();

            dispatch(
                actions.initialized({
                    schema,
                    values
                })
            );

            setContext(rootContext, { isEnabled: true });
        }
} satisfies Thunks;
