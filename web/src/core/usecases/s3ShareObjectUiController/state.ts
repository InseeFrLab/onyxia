import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { S3Uri } from "core/tools/S3Uri";

export type State = {
    s3Uri: S3Uri.NonTerminatedByDelimiter;
    validityDuration: State.ValidityDuration;
    httpUrl: string | undefined;
};

export namespace State {
    export type ValidityDuration = "one hour" | "one day" | "one week" | "one year";
}

export const name = "s3ShareObjectUiController";

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
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                };
            }
        ) => {
            const { s3Uri } = payload;

            return {
                s3Uri,
                validityDuration: "one day",
                httpUrl: undefined
            };
        },
        validityDurationChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    validityDuration: State.ValidityDuration;
                };
            }
        ) => {
            const { validityDuration } = payload;

            state.validityDuration = validityDuration;
        },
        httpUrlUpdated: (state, { payload }: { payload: { httpUrl: string } }) => {
            const { httpUrl } = payload;

            state.httpUrl = httpUrl;
        }
    }
});
