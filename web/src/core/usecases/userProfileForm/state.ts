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
import { same } from "evt/tools/inDepth";

export type State = {
    schema: JSONSchema;
    userProfile_previous: State.UserProfile;
    userProfile: State.UserProfile;
};

export namespace State {
    export type UserProfile = {
        userProfileValues: Record<string, Stringifyable>;
        autoInjectionDisabledFields: { valuesPath: (string | number)[] }[];
    };
}

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
                    userProfile: State.UserProfile;
                };
            }
        ) => {
            const { schema, userProfile } = payload;
            return {
                schema,
                userProfile_previous: structuredCloneButFunctions(userProfile),
                userProfile: structuredCloneButFunctions(userProfile)
            };
        },
        saved: state => {
            state.userProfile_previous = structuredCloneButFunctions(state.userProfile);
        },
        restored: state => {
            state.userProfile = structuredCloneButFunctions(state.userProfile_previous);
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

            const { userProfileValues } = state.userProfile;

            mutateHelmValues_update({
                helmValues: userProfileValues,
                formFieldValue,
                rootForm
            });
        },
        autoInjectedChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    valuesPath: (string | number)[];
                    isAutoInjected: boolean;
                };
            }
        ) => {
            const { valuesPath, isAutoInjected } = payload;

            const arr = state.userProfile.autoInjectionDisabledFields;

            if (isAutoInjected) {
                if (arr.find(entry => same(entry.valuesPath, valuesPath)) !== undefined) {
                    return;
                }

                arr.push({ valuesPath });
            } else {
                const entry = arr.find(entry => same(entry.valuesPath, valuesPath));

                if (entry === undefined) {
                    return;
                }

                arr.splice(arr.indexOf(entry), 1);
            }
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

            const {
                schema,
                userProfile: { userProfileValues }
            } = state;

            mutateHelmValues_addArrayItem({
                helmValues: userProfileValues,
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

            const { userProfileValues } = state.userProfile;

            mutateHelmValues_removeArrayItem({
                helmValues: userProfileValues,
                helmValuesPath: valuesPath,
                index
            });
        }
    }
});
