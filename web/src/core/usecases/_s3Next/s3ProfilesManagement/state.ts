import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { ResolvedTemplateBookmark } from "./decoupledLogic/resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./decoupledLogic/resolveTemplatedStsRole";

type State = {
    resolvedTemplatedBookmarks: {
        correspondingS3ConfigIndexInRegion: number;
        bookmarks: ResolvedTemplateBookmark[];
    }[];
    resolvedTemplatedStsRoles: {
        correspondingS3ConfigIndexInRegion: number;
        stsRoles: ResolvedTemplateStsRole[];
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
                    resolvedTemplatedStsRoles: State["resolvedTemplatedStsRoles"];
                };
            }
        ) => {
            const { resolvedTemplatedBookmarks, resolvedTemplatedStsRoles } = payload;

            const state: State = {
                resolvedTemplatedBookmarks,
                resolvedTemplatedStsRoles
            };

            return state;
        }
    }
});
