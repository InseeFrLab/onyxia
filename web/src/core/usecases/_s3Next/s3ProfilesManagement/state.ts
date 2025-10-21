import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { S3Profile } from "./decoupledLogic/s3Profiles";

type State = {
    resolvedTemplatedBookmarks: {
        correspondingS3ConfigIndexInRegion: number;
        bookmarks: S3Profile.DefinedInRegion.Bookmark[];
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
