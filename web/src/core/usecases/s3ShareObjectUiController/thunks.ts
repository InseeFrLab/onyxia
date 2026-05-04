import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import type { S3Uri } from "core/tools/S3Uri";
import * as s3ExplorerUiController from "core/usecases/s3ExplorerUiController";
import { privateSelectors } from "./selectors";
import type { State } from "./state";

export const thunks = {
    load:
        (params: { s3Uri: S3Uri.NonTerminatedByDelimiter }) =>
        (...args) => {
            const { s3Uri } = params;

            const [dispatch] = args;

            dispatch(
                actions.loaded({
                    s3Uri
                })
            );
        },
    changeValidityDuration:
        (params: { validityDuration: State.ValidityDuration }) =>
        (...args) => {
            const [dispatch] = args;

            const { validityDuration } = params;

            dispatch(actions.validityDurationChanged({ validityDuration }));
        }
} satisfies Thunks;

export const privateThunks = {
    updateHttpUrl:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            dispatch(
                actions.httpUrlUpdated({
                    httpUrl: undefined
                })
            );

            const s3Uri = privateSelectors.s3Uri(getState());

            const validityDuration = privateSelectors.validityDuration(getState());

            const httpUrl = await dispatch(
                s3ExplorerUiController.protectedThunks.getObjectHttpUrl({
                    s3Uri,
                    validityDurationSecond_ifNotPublic: (() => {
                        switch (validityDuration) {
                            case "one hour":
                                return 60 * 60;
                            case "one day":
                                return 60 * 60 * 24;
                            case "one week":
                                return 60 * 60 * 24 * 7;
                        }
                    })()
                })
            );

            dispatch(
                actions.httpUrlUpdated({
                    httpUrl
                })
            );
        }
} satisfies Thunks;
