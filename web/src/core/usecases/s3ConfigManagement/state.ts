export const name = "s3ConfigManagement";

import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";

type State = {
    bookmarkClaimValue: string[] | undefined;
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        initialized: (
            state,
            { payload }: { payload: { bookmarkClaimValue: string[] | undefined } }
        ) => {
            const { bookmarkClaimValue } = payload;
            state.bookmarkClaimValue = bookmarkClaimValue;
        }
    }
});
