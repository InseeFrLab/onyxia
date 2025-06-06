import type { JSONSchema } from "core/ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { Stringifyable } from "core/tools/Stringifyable";
import { structuredCloneButFunctions } from "core/tools/structuredCloneButFunctions";
import {
    type FormFieldValue,
    type RootForm,
    mutateHelmValues_addArrayItem,
    mutateHelmValues_removeArrayItem,
    mutateHelmValues_update
} from "core/usecases/launcher/decoupledLogic";

type State = {
    schema: JSONSchema;
    values_previous: Record<string, Stringifyable>;
    values: Record<string, Stringifyable>;
};

export const name = "userProfileForm";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>({
        debugMessage: "Used before initialization"
    }),
    reducers: {
        initialized: (
            _,
            {
                payload
            }: {
                payload: {
                    schema: JSONSchema;
                    values: Record<string, Stringifyable>;
                };
            }
        ) => {
            const { schema, values } = payload;
            return {
                schema,
                values_previous: structuredCloneButFunctions(values),
                values: structuredCloneButFunctions(values)
            };
        },
        saved: state => {
            state.values_previous = structuredCloneButFunctions(state.values);
        },
        restored: state => {
            state.values = structuredCloneButFunctions(state.values_previous);
        },
        formFieldValueChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    formFieldValue: FormFieldValue;
                    rootForm: RootForm;
                };
            }
        ) => {
            const { formFieldValue, rootForm } = payload;

            const { values } = state;

            mutateHelmValues_update({
                helmValues: values,
                formFieldValue,
                rootForm
            });
        },
        arrayItemAdded: (
            state,
            {
                payload
            }: {
                payload: {
                    valuesPath: (string | number)[];
                };
            }
        ) => {
            const { valuesPath } = payload;

            const { schema, values } = state;

            mutateHelmValues_addArrayItem({
                helmValues: values,
                helmValuesSchema: schema,
                xOnyxiaContext: {},
                helmValuesPath: valuesPath,
                helmValuesYaml: "{}"
            });
        },
        arrayItemRemoved: (
            state,
            {
                payload
            }: {
                payload: {
                    valuesPath: (string | number)[];
                    index: number;
                };
            }
        ) => {
            const { valuesPath, index } = payload;

            const { values } = state;

            mutateHelmValues_removeArrayItem({
                helmValues: values,
                helmValuesPath: valuesPath,
                index
            });
        }
    }
});
