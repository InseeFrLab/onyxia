import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { ResolvedTemplateBookmark } from "./decoupledLogic/resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./decoupledLogic/resolveTemplatedStsRole";

type State = {
    ambientProfileName: string | undefined;
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
                ambientProfileName: undefined,
                resolvedTemplatedBookmarks,
                resolvedTemplatedStsRoles
            };

            return state;
        },
        ambientProfileChanged: (
            state,
            { payload }: { payload: { profileName: string } }
        ) => {
            const { profileName } = payload;

            state.ambientProfileName = profileName;
        }
    }
});
