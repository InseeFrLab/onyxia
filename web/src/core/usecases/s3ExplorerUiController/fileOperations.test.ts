import { beforeEach, describe, expect, it, vi } from "vitest";
import { assert } from "tsafe/assert";
import type { State as RootState } from "core/bootstrap";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import { actions, reducer, name, type State } from "./state";
import { selectors, privateSelectors } from "./selectors";

vi.mock("core/usecases/s3ProfilesManagement", () => ({
    selectors: {
        ambientS3Profile: (root: {
            s3ProfilesManagement: { ambientProfileName: string | undefined };
        }) => {
            const profileName = root.s3ProfilesManagement.ambientProfileName;
            return profileName === undefined
                ? undefined
                : {
                      profileName,
                      origin: "onyxia instance config (setup by admin)",
                      bookmarks: [],
                      paramsOfCreateS3Client: {
                          isStsEnabled: false,
                          credentials: undefined,
                          url: "https://s3.example.test",
                          pathStyleAccess: true,
                          region: undefined
                      }
                  };
        },
        s3Profiles: () => []
    }
}));

vi.mock("core/rootContext", () => ({
    getRootContext: () => ({
        s3Config: { entries: [], defaultValuesOfCreationForm: undefined }
    })
}));

function objectUri(value: string): S3Uri.NonTerminatedByDelimiter {
    const uri = parseS3Uri({ value, delimiter: "/" });
    assert(!uri.isDelimiterTerminated);
    return uri;
}

function prefixUri(value: string): S3Uri.TerminatedByDelimiter {
    const uri = parseS3Uri({ value, delimiter: "/" });
    assert(uri.isDelimiterTerminated);
    return uri;
}

const sourcePrefix = prefixUri("s3://bucket/source/");
const destinationPrefix = prefixUri("s3://bucket/target/");
const smallObject = {
    sourceS3Uri: objectUri("s3://bucket/source/small.txt"),
    destinationS3Uri: objectUri("s3://bucket/target/small.txt"),
    size: 100
};
const largeObject = {
    sourceS3Uri: objectUri("s3://bucket/source/nested/large.txt"),
    destinationS3Uri: objectUri("s3://bucket/target/nested/large.txt"),
    size: 900
};

let state: State;

beforeEach(() => {
    state = reducer(undefined, { type: "test/init" });
});

function dispatch(action: Parameters<typeof reducer>[1]) {
    state = reducer(state, action);
}

function root(profileName: string | undefined): RootState {
    // These selectors only need the explorer slice and the mocked ambient profile.
    return {
        [name]: state,
        s3ProfilesManagement: { ambientProfileName: profileName }
    } as unknown as RootState;
}

function view() {
    return selectors.fileOperations(root("default"))[0];
}

function start(
    type: State.FileOperation["type"] = "copy",
    operationId = "operation",
    profileName = "default"
) {
    dispatch(
        actions.fileOperationStarted(
            type === "rename"
                ? {
                      operationId,
                      profileName,
                      type,
                      s3Uri: sourcePrefix,
                      newBasename: "renamed"
                  }
                : {
                      operationId,
                      profileName,
                      type,
                      s3Uris: [sourcePrefix],
                      destinationS3Uri: destinationPrefix
                  }
        )
    );
}

function list(objects = [smallObject, largeObject], operationId = "operation") {
    dispatch(actions.fileOperationObjectsListed({ operationId, objects }));
}

function finishListing(operationId = "operation") {
    dispatch(actions.fileOperationListingCompleted({ operationId }));
}

function progress(
    object: typeof smallObject,
    completionPercent: number,
    operationId = "operation"
) {
    dispatch(
        actions.fileOperationObjectProgressReported({
            operationId,
            sourceS3Uri: object.sourceS3Uri,
            completionPercent
        })
    );
}

function completeObject(object: typeof smallObject, operationId = "operation") {
    dispatch(
        actions.fileOperationObjectCompleted({
            operationId,
            sourceS3Uri: object.sourceS3Uri
        })
    );
}

describe("S3 file operation feedback", () => {
    it("starts with no feedback entries", () => {
        expect(state.fileOperations).toEqual([]);
        expect(selectors.fileOperations(root("default"))).toEqual([]);
        expect(selectors.mainView(root("default")).fileOperations).toEqual([]);
    });

    it.each(["rename", "copy", "move"] as const)(
        "tracks the %s request and start time",
        type => {
            const before = Date.now();
            start(type);
            expect(view()).toMatchObject({
                operationId: "operation",
                profileName: "default",
                type,
                status: "running",
                phase: "listing",
                isOngoing: true,
                isListingComplete: false,
                objects: [],
                discoveredObjectCount: 0,
                totalObjectCount: undefined,
                totalSize: undefined,
                completionPercent: undefined
            });
            expect(view().operationStartTime).toBeGreaterThanOrEqual(before);
            expect(selectors.mainView(root("default")).fileOperations).toBe(
                selectors.fileOperations(root("default"))
            );
        }
    );

    it("keeps progress indeterminate while accumulating a recursive listing", () => {
        start();
        list([smallObject]);
        progress(smallObject, 50);
        expect(view()).toMatchObject({
            discoveredObjectCount: 1,
            copiedSize: 50,
            totalSize: undefined,
            totalObjectCount: undefined,
            completionPercent: undefined
        });
        list([largeObject]);
        finishListing();
        expect(view()).toMatchObject({
            phase: "copying",
            discoveredObjectCount: 2,
            totalObjectCount: 2,
            totalSize: 1000,
            copiedSize: 50,
            completionPercent: 5
        });
    });

    it("does not count duplicate objects from overlapping source prefixes twice", () => {
        start();
        list([smallObject]);
        progress(smallObject, 50);
        list([smallObject, largeObject, largeObject]);
        finishListing();
        expect(view().totalObjectCount).toBe(2);
        expect(view().totalSize).toBe(1000);
        expect(view().copiedSize).toBe(50);
    });

    it.each(["rename", "copy", "move"] as const)(
        "weights %s progress by bytes instead of averaging files",
        type => {
            start(type);
            list();
            finishListing();
            progress(smallObject, 100);
            completeObject(smallObject);
            progress(largeObject, 50);
            expect(view()).toMatchObject({
                totalObjectCount: 2,
                completedObjectCount: 1,
                erroredObjectCount: 0,
                totalSize: 1000,
                copiedSize: 550,
                completionPercent: 55
            });
        }
    );

    it.each(["rename", "move"] as const)(
        "does not finish %s until source deletions complete",
        type => {
            start(type);
            list();
            finishListing();
            progress(smallObject, 100);
            progress(largeObject, 100);
            expect(view()).toMatchObject({
                phase: "deleting",
                completionPercent: 99,
                copiedSize: 1000,
                completedObjectCount: 0,
                isOngoing: true
            });
            expect(() =>
                dispatch(actions.fileOperationCompleted({ operationId: "operation" }))
            ).toThrow();
            completeObject(smallObject);
            completeObject(largeObject);
            expect(view().completionPercent).toBe(99);
            dispatch(actions.fileOperationCompleted({ operationId: "operation" }));
            expect(view()).toMatchObject({
                phase: "completed",
                status: "completed",
                completionPercent: 100,
                completedObjectCount: 2,
                isOngoing: false
            });
        }
    );

    it("handles zero-byte objects without division by zero", () => {
        start();
        const objects = [smallObject, largeObject].map(object => ({
            ...object,
            size: 0
        }));
        list(objects);
        finishListing();
        expect(view().completionPercent).toBe(0);
        progress(objects[0], 100);
        completeObject(objects[0]);
        expect(view()).toMatchObject({
            completionPercent: 50,
            totalSize: 0,
            copiedSize: 0,
            completedObjectCount: 1
        });
        progress(objects[1], 100);
        completeObject(objects[1]);
        dispatch(actions.fileOperationCompleted({ operationId: "operation" }));
        expect(view().completionPercent).toBe(100);
    });

    it("only completes an empty prefix after enumeration has finished", () => {
        start();
        expect(() =>
            dispatch(actions.fileOperationCompleted({ operationId: "operation" }))
        ).toThrow();
        finishListing();
        expect(view()).toMatchObject({
            totalObjectCount: 0,
            totalSize: 0,
            completionPercent: 0
        });
        dispatch(actions.fileOperationCompleted({ operationId: "operation" }));
        expect(view()).toMatchObject({ completionPercent: 100, phase: "completed" });
    });

    it("retains individual failures and successful objects when part of a move fails", () => {
        start("move");
        list();
        finishListing();
        progress(smallObject, 100);
        completeObject(smallObject);
        progress(largeObject, 100);
        dispatch(
            actions.fileOperationObjectErrored({
                operationId: "operation",
                sourceS3Uri: largeObject.sourceS3Uri,
                erroredErrorMessage: "Source deletion denied"
            })
        );
        dispatch(actions.fileOperationCompleted({ operationId: "operation" }));
        expect(view()).toMatchObject({
            status: "errored",
            phase: "errored",
            isOngoing: false,
            completionPercent: 99,
            completedObjectCount: 1,
            erroredObjectCount: 1
        });
        expect(view().objects[0].isCompleted).toBe(true);
        expect(view().objects[1].erroredErrorMessage).toBe("Source deletion denied");
    });

    it.each(["errored", "canceled"] as const)(
        "preserves unknown totals when listing is %s",
        status => {
            start();
            list([smallObject]);
            if (status === "errored") {
                dispatch(
                    actions.fileOperationErrored({
                        operationId: "operation",
                        erroredErrorMessage: "Cannot list nested prefix"
                    })
                );
            } else {
                dispatch(actions.fileOperationCanceled({ operationId: "operation" }));
            }
            expect(view()).toMatchObject({
                status,
                phase: status,
                isOngoing: false,
                discoveredObjectCount: 1,
                totalObjectCount: undefined,
                totalSize: undefined,
                completionPercent: undefined
            });
        }
    );

    it("preserves partial results after cancellation and rejects late progress", () => {
        start("move");
        list();
        finishListing();
        progress(smallObject, 100);
        completeObject(smallObject);
        progress(largeObject, 50);
        dispatch(actions.fileOperationCanceled({ operationId: "operation" }));
        expect(view()).toMatchObject({
            phase: "canceled",
            completionPercent: 55,
            completedObjectCount: 1,
            copiedSize: 550,
            isOngoing: false
        });
        expect(() => progress(largeObject, 60)).toThrow();
        expect(view().copiedSize).toBe(550);
    });

    it("keeps ongoing operations when flushing finished feedback", () => {
        start("copy", "finished");
        dispatch(actions.fileOperationCanceled({ operationId: "finished" }));
        start("move", "running");
        dispatch(actions.fileOperationsFlushed());
        expect(state.fileOperations.map(operation => operation.operationId)).toEqual([
            "running"
        ]);
    });

    it("isolates progress by operation ID and filters feedback by the ambient profile", () => {
        start("copy", "first", "default");
        start("move", "second", "other");
        list([smallObject], "first");
        list([smallObject], "second");
        finishListing("first");
        finishListing("second");
        progress(smallObject, 50, "first");
        expect(selectors.fileOperations(root("default"))).toMatchObject([
            { operationId: "first", completionPercent: 50 }
        ]);
        expect(selectors.fileOperations(root("other"))).toMatchObject([
            { operationId: "second", completionPercent: 0 }
        ]);
        expect(selectors.fileOperations(root(undefined))).toEqual([]);
        expect(privateSelectors.fileOperations(root("default"))).toHaveLength(2);
        expect(selectors.fileOperations_allProfiles(root(undefined))).toMatchObject([
            { operationId: "first", completionPercent: 50 },
            { operationId: "second", completionPercent: 0 }
        ]);
        expect(selectors.mainView(root("other")).fileOperations[0].operationId).toBe(
            "second"
        );
    });

    it.each([-1, 101, NaN, Infinity])("rejects invalid copy progress %s", percent => {
        start();
        list();
        expect(() => progress(smallObject, percent)).toThrow();
        expect(state.fileOperations[0].objects[0].copyCompletionPercent).toBe(0);
    });

    it("rejects regressing progress, premature object completion, and duplicate operation IDs", () => {
        start();
        list();
        progress(smallObject, 50);
        expect(() => progress(smallObject, 40)).toThrow();
        expect(() => completeObject(smallObject)).toThrow();
        expect(() => start()).toThrow();
    });
});
