import { assert, id } from "tsafe";
import { createUsecaseActions } from "clean-architecture";
import type { S3UriPrefixObj, S3UriObj } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";

//All explorer paths are expected to be absolute (start with /)

export type State = {
    commandLogsEntries: State.CommandLogsEntry[];
    uploads: State.Upload[];
    listedPrefixByProfile: Record<string, State.ListedPrefix | undefined>;
};

export namespace State {
    export type CommandLogsEntry = {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    };

    export type Upload = {
        profileName: string;
        s3UriObj: S3UriObj;
        size: number;
        completionPercent: number;
    };

    export type ListedPrefix = {
        next:
            | {
                  s3UriPrefixObj: S3UriPrefixObj;
                  errorCase: ListedPrefix.ErrorCase | undefined;
              }
            | undefined;
        current:
            | {
                  s3UriPrefixObj: S3UriPrefixObj;
                  items: ListedPrefix.Item[];
              }
            | undefined;
    };

    export namespace ListedPrefix {
        export type ErrorCase = "access denied" | "no such bucket";

        export type Item = Item.PrefixSegment | Item.Object;

        export namespace Item {
            export type PrefixSegment = {
                type: "prefix segment";
                s3UriPrefixObj: S3UriPrefixObj;
            };

            export type Object = {
                type: "object";
                s3UriObj: S3UriObj;
            };
        }
    }
}

export const name = "s3ExplorerUiController_next";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        commandLogsEntries: [],
        uploads: [],
        listedPrefixByProfile: {}
    }),
    reducers: {
        fileUploadStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3UriObj: S3UriObj;
                    size: number;
                };
            }
        ) => {
            const { profileName, s3UriObj, size } = payload;

            assert(
                state.uploads.find(
                    upload =>
                        upload.profileName === profileName &&
                        same(upload.s3UriObj, s3UriObj)
                ) === undefined
            );

            state.uploads.push({
                profileName,
                s3UriObj,
                size,
                completionPercent: 0
            });
        },
        uploadProgressUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3UriObj: S3UriObj;
                    completionPercent: number;
                };
            }
        ) => {
            const { profileName, s3UriObj, completionPercent } = payload;

            const upload = state.uploads.find(
                upload =>
                    upload.profileName === profileName && same(upload.s3UriObj, s3UriObj)
            );

            assert(upload !== undefined);

            upload.completionPercent = completionPercent;
        },
        listingCleared: (state, { payload }: { payload: { profileName: string } }) => {
            const { profileName } = payload;

            state.listedPrefixByProfile[profileName] = {
                current: undefined,
                next: undefined
            };
        },
        listingStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3UriPrefixObj: S3UriPrefixObj;
                };
            }
        ) => {
            const { profileName, s3UriPrefixObj } = payload;

            const listedPrefix = (state.listedPrefixByProfile[profileName] ??= {
                next: undefined,
                current: undefined
            });

            listedPrefix.next = {
                s3UriPrefixObj,
                errorCase: undefined
            };
        },
        listingCompletedSuccessfully: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    items: State.ListedPrefix.Item[];
                };
            }
        ) => {
            const { profileName, items } = payload;

            const listedPrefix = state.listedPrefixByProfile[profileName];

            assert(listedPrefix !== undefined);

            assert(
                listedPrefix.next !== undefined &&
                    listedPrefix.next.errorCase === undefined
            );

            const s3UriPrefixObj = listedPrefix.next.s3UriPrefixObj;

            listedPrefix.next = undefined;

            listedPrefix.current = {
                s3UriPrefixObj,
                items
            };
        },

        listingFailed: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3UriPrefixObj: S3UriPrefixObj;
                    errorCase: State.ListedPrefix.ErrorCase;
                };
            }
        ) => {
            const { profileName, s3UriPrefixObj, errorCase } = payload;

            const listedPrefix = state.listedPrefixByProfile[profileName];

            assert(listedPrefix !== undefined);

            assert(
                listedPrefix.next !== undefined &&
                    listedPrefix.next.errorCase === undefined &&
                    same(listedPrefix.next.s3UriPrefixObj, s3UriPrefixObj)
            );

            listedPrefix.next.errorCase = errorCase;
        },
        commandLogIssued: (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                    cmd: string;
                };
            }
        ) => {
            const { cmdId, cmd } = payload;

            state.commandLogsEntries.push({
                cmdId,
                cmd,
                resp: undefined
            });
        },
        commandLogCancelled: (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                };
            }
        ) => {
            const { cmdId } = payload;

            const index = state.commandLogsEntries.findIndex(
                entry => entry.cmdId === cmdId
            );

            assert(index >= 0);

            state.commandLogsEntries.splice(index, 1);
        },
        commandLogResponseReceived: (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                    resp: string;
                };
            }
        ) => {
            const { cmdId, resp } = payload;

            const entry = state.commandLogsEntries.find(entry => entry.cmdId === cmdId);

            assert(entry !== undefined);

            entry.resp = resp;
        }
    }
});
