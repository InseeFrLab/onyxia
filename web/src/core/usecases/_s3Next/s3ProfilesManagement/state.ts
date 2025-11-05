import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { ResolvedTemplateBookmark } from "./decoupledLogic/resolveTemplatedBookmark";

type State = {
    resolvedTemplatedBookmarks: {
        correspondingS3ConfigIndexInRegion: number;
        bookmarks: ResolvedTemplateBookmark[];
    }[];
};

export const name = "s3ProfilesManagement";

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
                    resolvedTemplatedBookmarks: State["resolvedTemplatedBookmarks"];
                };
            }
        ) => {
            const { resolvedTemplatedBookmarks } = payload;

            const state: State = {
                resolvedTemplatedBookmarks
            };

            return state;
        }
    }
});
