import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { createObjectThatThrowsIfAccessed } from "clean-architecture";

export type State = {
    formValues: State.FormValues;
    creationTimeOfProfileToEdit: number | undefined;
};

export namespace State {
    export type FormValues = {
        profileName: string;
        url: string;
        region: string | undefined;
        pathStyleAccess: boolean;
        isAnonymous: boolean;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        sessionToken: string | undefined;
    };
}

export type ChangeValueParams<K extends keyof State.FormValues = keyof State.FormValues> =
    {
        key: K;
        value: State.FormValues[K];
    };

export const name = "s3ProfilesCreationUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        loaded: (
            _state,
            {
                payload
            }: {
                payload: {
                    creationTimeOfProfileToEdit: number | undefined;
                    initialFormValues: State.FormValues;
                };
            }
        ) => {
            const { creationTimeOfProfileToEdit, initialFormValues } = payload;

            return id<State>({
                formValues: initialFormValues,
                creationTimeOfProfileToEdit
            });
        },
        formValueChanged: (
            state,
            {
                payload
            }: {
                payload: ChangeValueParams;
            }
        ) => {
            if (state.formValues[payload.key] === payload.value) {
                return;
            }

            Object.assign(state.formValues, { [payload.key]: payload.value });
        }
    }
});
