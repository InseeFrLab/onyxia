import type { ResolvedAdminBookmark } from "./decoupledLogic/resolveS3AdminBookmarks";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";

type State = {
    resolvedAdminBookmarks: ResolvedAdminBookmark[];
};

export const name = "s3ConfigManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        initialized: (
            _,
            {
                payload
            }: {
                payload: {
                    resolvedAdminBookmarks: ResolvedAdminBookmark[];
                };
            }
        ) => {
            const { resolvedAdminBookmarks } = payload;

            const state: State = {
                resolvedAdminBookmarks
            };

            return state;
        }
    }
});
