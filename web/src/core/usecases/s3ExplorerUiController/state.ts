import { assert, id } from "tsafe";
import { createUsecaseActions } from "clean-architecture";
import { type S3Uri, stringifyS3Uri, getIsInside } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";
import type { BucketPolicies } from "core/tools/bucketPolicies";

//All explorer paths are expected to be absolute (start with /)

export type State = {
    commandLogsEntries: State.CommandLogsEntry[];
    uploads: State.Upload[];
    deletions: State.Deletion[];
    listedPrefixByProfile: Record<string, State.ListedPrefix | undefined>;
    bucketPoliciesByBucket: Record<
        string,
        { bucketPolicies: BucketPolicies | undefined; profileName: string } | undefined
    >;
};

export namespace State {
    export type CommandLogsEntry = {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    };

    export type Upload = {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        size: number;
        completionPercent: number;
        uploadStartTime: number;
        erroredErrorMessage: string | undefined;
    };

    export type Deletion = {
        profileName: string;
        s3Uri: S3Uri;
    };

    export type ListedPrefix = {
        next:
            | {
                  s3Uri: S3Uri;
                  errorCase: ListedPrefix.ErrorCase | undefined;
              }
            | undefined;
        current:
            | {
                  s3Uri: S3Uri;
                  items: ListedPrefix.Item[];
              }
            | undefined;
    };

    export namespace ListedPrefix {
        export type ErrorCase = "access denied" | "no such bucket";

        export type Item = Item.Prefix | Item.Object;

        export namespace Item {
            export type Prefix = {
                type: "prefix";
                s3Uri: S3Uri.TerminatedByDelimiter;
            };

            export type Object = {
                type: "object";
                s3Uri: S3Uri.NonTerminatedByDelimiter;
                size: number;
                lastModified: number;
            };
        }
    }
}

export const name = "s3ExplorerUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        commandLogsEntries: [],
        uploads: [],
        deletions: [],
        listedPrefixByProfile: {},
        bucketPoliciesByBucket: {}
    }),
    reducers: {
        bucketPoliciesUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    bucket: string;
                    profileName: string;
                    bucketPolicies: BucketPolicies | undefined;
                };
            }
        ) => {
            const { bucket, profileName, bucketPolicies } = payload;

            state.bucketPoliciesByBucket[bucket] = { profileName, bucketPolicies };
        },
        putObjectStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                    size: number;
                };
            }
        ) => {
            const { profileName, s3Uri, size } = payload;

            retry_case: {
                const upload = state.uploads.find(
                    upload =>
                        upload.profileName === profileName && same(upload.s3Uri, s3Uri)
                );

                if (upload === undefined) {
                    break retry_case;
                }

                assert(upload.erroredErrorMessage !== undefined);

                upload.completionPercent = 0;
                upload.erroredErrorMessage = undefined;
                upload.uploadStartTime = Date.now();

                return;
            }

            state.uploads.push({
                profileName,
                s3Uri,
                size,
                completionPercent: 0,
                uploadStartTime: Date.now(),
                erroredErrorMessage: undefined
            });
        },
        uploadFlushed: state => {
            state.uploads = [];
        },
        uploadCanceled: (
            state,
            {
                payload
            }: { payload: { profileName: string; s3Uri: S3Uri.NonTerminatedByDelimiter } }
        ) => {
            const { profileName, s3Uri } = payload;

            const upload_toDelete = state.uploads.find(
                upload => upload.profileName === profileName && same(upload.s3Uri, s3Uri)
            );

            assert(upload_toDelete !== undefined);
            assert(upload_toDelete.erroredErrorMessage === undefined);

            const i = state.uploads.indexOf(upload_toDelete);

            assert(i !== -1);

            state.uploads.splice(i, 1);
        },
        putObjectProgressReported: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                    completionPercent: number;
                };
            }
        ) => {
            const { profileName, s3Uri, completionPercent } = payload;

            const upload = state.uploads.find(
                upload => upload.profileName === profileName && same(upload.s3Uri, s3Uri)
            );

            assert(upload !== undefined);
            assert(upload.erroredErrorMessage === undefined);

            upload.erroredErrorMessage = undefined;
            upload.completionPercent = completionPercent;
        },
        putObjectErrored: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                    erroredErrorMessage: string;
                };
            }
        ) => {
            const { profileName, s3Uri, erroredErrorMessage } = payload;

            const upload = state.uploads.find(
                upload => upload.profileName === profileName && same(upload.s3Uri, s3Uri)
            );

            assert(upload !== undefined);
            assert(upload.erroredErrorMessage === undefined);
            assert(upload.completionPercent !== 100);

            upload.erroredErrorMessage = erroredErrorMessage;
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
                    s3Uri: S3Uri;
                };
            }
        ) => {
            const { profileName, s3Uri } = payload;

            const listedPrefix = (state.listedPrefixByProfile[profileName] ??= {
                next: undefined,
                current: undefined
            });

            listedPrefix.next = {
                s3Uri,
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

            const { s3Uri } = listedPrefix.next;

            listedPrefix.next = undefined;

            listedPrefix.current = {
                s3Uri,
                items
            };
        },
        listingCompletedSuccessfully_inferFromCurrentState: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri;
                };
            }
        ) => {
            const { profileName, s3Uri } = payload;

            const listedPrefix = state.listedPrefixByProfile[profileName];

            assert(listedPrefix !== undefined);

            listedPrefix.next = undefined;

            assert(listedPrefix.current !== undefined);

            const { items } = listedPrefix.current;

            listedPrefix.current = {
                s3Uri,
                items: items.filter(item =>
                    stringifyS3Uri(item.s3Uri).startsWith(stringifyS3Uri(s3Uri))
                )
            };
        },

        listingFailed: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri;
                    errorCase: State.ListedPrefix.ErrorCase;
                };
            }
        ) => {
            const { profileName, s3Uri, errorCase } = payload;

            const listedPrefix = state.listedPrefixByProfile[profileName];

            assert(listedPrefix !== undefined);

            assert(
                listedPrefix.next !== undefined &&
                    listedPrefix.next.errorCase === undefined &&
                    same(listedPrefix.next.s3Uri, s3Uri)
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
        },
        deletionStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri;
                };
            }
        ) => {
            const { profileName, s3Uri } = payload;

            state.deletions.push({
                profileName,
                s3Uri
            });

            {
                state.uploads
                    .filter(
                        upload =>
                            upload.profileName === profileName &&
                            (same(s3Uri, upload.s3Uri) ||
                                getIsInside({ s3UriPrefix: s3Uri, s3Uri: upload.s3Uri })
                                    .isInside)
                    )
                    .forEach(upload => {
                        const index = state.uploads.indexOf(upload);

                        assert(index !== -1);

                        state.uploads.splice(index, 1);
                    });
            }
        },
        deletionCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    profileName: string;
                    s3Uri: S3Uri;
                };
            }
        ) => {
            const { profileName, s3Uri } = payload;

            const i = state.deletions.findIndex(
                deletion =>
                    deletion.profileName === profileName && same(deletion.s3Uri, s3Uri)
            );

            assert(i !== -1);

            state.deletions.splice(i, 1);
        }
    }
});
