import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCore } from "clean-architecture";
import { Evt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { actions, name, reducer } from "./state";
import {
    thunks,
    privateThunks,
    evtFileOperationConflict,
    evtAskOverwriteConfirmation,
    evtDisplayError
} from "./thunks";
import type { FileOperationConflict } from "./evt";

const mocks = vi.hoisted(() => ({ getS3Client: vi.fn() }));

vi.mock("core/usecases/s3ProfilesManagement", () => ({
    selectors: {
        ambientS3Profile: () => ({ profileName: "default" }),
        s3Profiles: () => []
    },
    protectedThunks: {
        getS3Client:
            ({ profileName }: { profileName: string }) =>
            () =>
                mocks.getS3Client(profileName)
    }
}));

const uri = (value: string) => parseS3Uri({ value, delimiter: "/" });
function prefix(value: string): S3Uri.TerminatedByDelimiter {
    const result = uri(value);
    assert(result.isDelimiterTerminated);
    return result;
}
function object(value: string): S3Uri.NonTerminatedByDelimiter {
    const result = uri(value);
    assert(!result.isDelimiterTerminated);
    return result;
}

const initialObjects = {
    "s3://bucket/foo/a.csv": "source a",
    "s3://bucket/foo/b.csv": "source b",
    "s3://bucket/x.csv": "source x",
    "s3://bucket/xxx/foo/a.csv": "original a",
    "s3://bucket/xxx/foo/c.csv": "original c",
    "s3://bucket/xxx/x.csv": "original x"
};

let ctx = Evt.newCtx();
beforeEach(() => {
    ctx = Evt.newCtx();
    mocks.getS3Client.mockReset();
});
afterEach(() => ctx.done());

function setup(contents: Record<string, string> = initialObjects) {
    const objects = new Map(Object.entries(contents));
    const timeline: string[] = [];
    const errors: string[] = [];
    evtDisplayError.attach(ctx, ({ errorMessage }) => errors.push(errorMessage));
    const listObjects = vi.fn<S3Client["listObjects"]>(async ({ s3Uri }) => {
        const query = stringifyS3Uri(s3Uri);
        timeline.push(`list ${query}`);
        const prefixes = new Set<string>();
        const resultObjects: S3Client.ListObjectsReturn.Success.Object[] = [];
        for (const [key, content] of objects) {
            if (!key.startsWith(query)) {
                continue;
            }
            const suffix = key.slice(query.length);
            const nextDelimiter = suffix.indexOf(s3Uri.delimiter);
            if (nextDelimiter !== -1) {
                prefixes.add(query + suffix.slice(0, nextDelimiter + 1));
            } else if (!key.endsWith(s3Uri.delimiter)) {
                resultObjects.push({
                    s3Uri: object(key),
                    size: content.length,
                    lastModified: 0
                });
            }
        }
        return {
            isSuccess: true,
            objects: resultObjects,
            prefixes: [...prefixes].map(prefix)
        };
    });
    const copyObject = vi.fn<S3Client["copyObject"]>(
        async ({ sourceS3Uri, destinationS3Uri, onCopyProgress }) => {
            const source = stringifyS3Uri(sourceS3Uri);
            const destination = stringifyS3Uri(destinationS3Uri);
            timeline.push(`copy ${source}`);
            const content = objects.get(source);
            assert(content !== undefined);
            onCopyProgress({ copyPercent: 50 });
            objects.set(destination, content);
            onCopyProgress({ copyPercent: 100 });
            return { status: "success" };
        }
    );
    const deleteObject = vi.fn<S3Client["deleteObject"]>(async ({ s3Uri }) => {
        const key = stringifyS3Uri(s3Uri);
        timeline.push(`delete ${key}`);
        objects.delete(key);
    });
    const putObject = vi.fn<S3Client["putObject"]>(async () => ({ status: "success" }));
    mocks.getS3Client.mockResolvedValue({
        listObjects,
        copyObject,
        deleteObject,
        putObject
    });
    const store = createCore({
        context: {},
        usecases: {
            s3ExplorerUiController: { name, reducer, actions, thunks: {}, selectors: {} }
        }
    });
    const dispatch = store.dispatch as unknown as Parameters<
        ReturnType<typeof thunks.copy>
    >[0];
    const operations = () => store.getState().s3ExplorerUiController.fileOperations;
    return {
        objects,
        timeline,
        errors,
        listObjects,
        copyObject,
        deleteObject,
        putObject,
        dispatch,
        operations,
        store
    };
}

describe("file operation conflict preparation", () => {
    for (const operationType of ["copy", "move"] as const) {
        it.each([
            { directoryChoice: "merge", objectChoice: "overwrite" },
            { directoryChoice: "skip", objectChoice: "overwrite" },
            { directoryChoice: "skip", objectChoice: "skip" }
        ] as const)(
            `${operationType}: $directoryChoice directory, $objectChoice object`,
            async ({ directoryChoice, objectChoice }) => {
                const s = setup();
                const questions: FileOperationConflict[] = [];
                evtFileOperationConflict.attach(ctx, conflict => {
                    expect(s.copyObject).not.toHaveBeenCalled();
                    expect(s.deleteObject).not.toHaveBeenCalled();
                    questions.push(conflict);
                    if (conflict.type === "directory") {
                        conflict.resolveResponse({
                            action: directoryChoice,
                            doRememberChoice: false
                        });
                    } else {
                        conflict.resolveResponse({
                            action: objectChoice,
                            doRememberChoice: false
                        });
                    }
                });
                await s.dispatch(
                    thunks[operationType]({
                        s3Uris: [uri("s3://bucket/foo/"), uri("s3://bucket/x.csv")],
                        destinationS3Uri: prefix("s3://bucket/xxx/")
                    })
                );

                expect(
                    questions.map(q => [
                        q.type,
                        stringifyS3Uri(q.destinationS3Uri),
                        q.operationType
                    ])
                ).toEqual([
                    ["directory", "s3://bucket/xxx/foo/", operationType],
                    ["object", "s3://bucket/xxx/x.csv", operationType]
                ]);
                expect(s.objects.get("s3://bucket/xxx/foo/a.csv")).toBe(
                    directoryChoice === "merge" ? "source a" : "original a"
                );
                expect(s.objects.get("s3://bucket/xxx/foo/b.csv")).toBe(
                    directoryChoice === "merge" ? "source b" : undefined
                );
                expect(s.objects.get("s3://bucket/xxx/foo/c.csv")).toBe("original c");
                expect(s.objects.get("s3://bucket/xxx/x.csv")).toBe(
                    objectChoice === "overwrite" ? "source x" : "original x"
                );
                expect(s.objects.has("s3://bucket/foo/a.csv")).toBe(
                    operationType === "copy" || directoryChoice === "skip"
                );
                expect(s.objects.has("s3://bucket/foo/b.csv")).toBe(
                    operationType === "copy" || directoryChoice === "skip"
                );
                expect(s.objects.has("s3://bucket/x.csv")).toBe(
                    operationType === "copy" || objectChoice === "skip"
                );
                const [operation] = s.operations();
                expect(operation.status).toBe("completed");
                expect(operation.objects).toHaveLength(
                    (directoryChoice === "merge" ? 2 : 0) +
                        (objectChoice === "overwrite" ? 1 : 0)
                );
                expect(operation.objects.every(object => object.isCompleted)).toBe(true);
                expect(s.errors).toEqual([]);
                if (operationType === "move" && s.deleteObject.mock.calls.length !== 0) {
                    const firstDelete = s.timeline.findIndex(entry =>
                        entry.startsWith("delete ")
                    );
                    expect(
                        s.timeline
                            .slice(firstDelete)
                            .some(entry => entry.startsWith("copy "))
                    ).toBe(false);
                }
            }
        );
    }

    it("waits for every answer, then cancels everything even after earlier approvals and nonconflicting items", async () => {
        const s = setup({ ...initialObjects, "s3://bucket/free.csv": "free" });
        const dQuestion = new Deferred<FileOperationConflict.Object>();
        evtFileOperationConflict.attach(ctx, conflict => {
            if (conflict.type === "directory") {
                conflict.resolveResponse({ action: "merge", doRememberChoice: false });
            } else {
                dQuestion.resolve(conflict);
            }
        });
        const pr = s.dispatch(
            thunks.move({
                s3Uris: [
                    uri("s3://bucket/free.csv"),
                    uri("s3://bucket/foo/"),
                    uri("s3://bucket/x.csv")
                ],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            })
        );
        const question = await dQuestion.pr;
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.deleteObject).not.toHaveBeenCalled();
        question.resolveResponse({ action: "cancel" });
        await pr;
        expect(Object.fromEntries(s.objects)).toEqual({
            ...initialObjects,
            "s3://bucket/free.csv": "free"
        });
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.deleteObject).not.toHaveBeenCalled();
        expect(s.operations()[0].status).toBe("canceled");
    });

    it("cancels on the first directory question", async () => {
        const s = setup();
        const questions: FileOperationConflict[] = [];
        evtFileOperationConflict.attach(ctx, conflict => {
            questions.push(conflict);
            conflict.resolveResponse({ action: "cancel" });
        });
        await s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/foo/"), uri("s3://bucket/x.csv")],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            })
        );
        expect(questions).toHaveLength(1);
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.operations()[0].status).toBe("canceled");
    });

    it.each(["merge", "skip"] as const)(
        "remembers directory %s separately from object choices and resets both for the next operation",
        async directoryChoice => {
            const s = setup({
                ...initialObjects,
                "s3://bucket/bar/nested/z.csv": "source z",
                "s3://bucket/xxx/bar/nested/z.csv": "original z",
                "s3://bucket/y.csv": "source y",
                "s3://bucket/xxx/y.csv": "original y"
            });
            const questions: string[] = [];
            const objectChoice = directoryChoice === "merge" ? "skip" : "overwrite";
            evtFileOperationConflict.attach(ctx, conflict => {
                questions.push(conflict.type);
                if (conflict.type === "directory") {
                    conflict.resolveResponse({
                        action: directoryChoice,
                        doRememberChoice: true
                    });
                } else {
                    conflict.resolveResponse({
                        action: objectChoice,
                        doRememberChoice: true
                    });
                }
            });
            const request = {
                s3Uris: [
                    uri("s3://bucket/foo/"),
                    uri("s3://bucket/x.csv"),
                    uri("s3://bucket/bar/"),
                    uri("s3://bucket/y.csv")
                ],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            };
            await s.dispatch(thunks.copy(request));
            expect(questions).toEqual(["directory", "object"]);
            expect(s.objects.get("s3://bucket/xxx/bar/nested/z.csv")).toBe(
                directoryChoice === "merge" ? "source z" : "original z"
            );
            expect(s.objects.get("s3://bucket/xxx/y.csv")).toBe(
                objectChoice === "skip" ? "original y" : "source y"
            );
            await s.dispatch(thunks.copy(request));
            expect(questions).toEqual(["directory", "object", "directory", "object"]);
        }
    );

    it("asks again for each object when remember choice is false", async () => {
        const s = setup({
            ...initialObjects,
            "s3://bucket/y.csv": "source y",
            "s3://bucket/xxx/y.csv": "original y"
        });
        const questions: FileOperationConflict.Object[] = [];
        evtFileOperationConflict.attach(ctx, conflict => {
            assert(conflict.type === "object");
            questions.push(conflict);
            conflict.resolveResponse({
                action: questions.length === 1 ? "overwrite" : "skip",
                doRememberChoice: false
            });
        });
        await s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/x.csv"), uri("s3://bucket/y.csv")],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            })
        );
        expect(questions).toHaveLength(2);
        expect(s.objects.get("s3://bucket/xxx/x.csv")).toBe("source x");
        expect(s.objects.get("s3://bucket/xxx/y.csv")).toBe("original y");
    });
});

describe("recursive execution and rename", () => {
    it("lists a picker destination with its captured profile without changing explorer state", async () => {
        const s = setup();
        s.dispatch(
            actions.listingStarted({
                profileName: "default",
                s3Uri: prefix("s3://bucket/")
            })
        );
        const before = s.store.getState();
        const result = await s.dispatch(
            thunks.listFileOperationDestination({
                profileName: "captured-profile",
                s3Uri: prefix("s3://bucket/xxx/")
            })
        );
        expect(result.isSuccess).toBe(true);
        expect(mocks.getS3Client).toHaveBeenCalledWith("captured-profile");
        expect(s.store.getState()).toBe(before);
        expect(s.copyObject).not.toHaveBeenCalled();
    });
    it("recursively copies across buckets, keeping relative paths and deduplicating overlapping selections", async () => {
        const s = setup({
            "s3://bucket/foo/a.csv": "a",
            "s3://bucket/foo/nested/deep/b.csv": "bbb",
            "s3://bucket/foo/nested/zero": ""
        });
        await s.dispatch(
            thunks.copy({
                s3Uris: [
                    uri("s3://bucket/foo/"),
                    uri("s3://bucket/foo/nested/"),
                    uri("s3://bucket/foo/a.csv"),
                    uri("s3://bucket/foo/")
                ],
                destinationS3Uri: prefix("s3://other/target/")
            })
        );
        expect(s.copyObject).toHaveBeenCalledTimes(3);
        expect(s.objects.get("s3://other/target/foo/nested/deep/b.csv")).toBe("bbb");
        expect(s.objects.get("s3://other/target/foo/nested/zero")).toBe("");
        expect(s.deleteObject).not.toHaveBeenCalled();
        const [operation] = s.operations();
        expect(operation).toMatchObject({
            status: "completed",
            isListingComplete: true,
            profileName: "default"
        });
        expect(operation.objects.map(object => object.size).sort()).toEqual([0, 1, 3]);
        expect(
            new Set(s.listObjects.mock.calls.map(([{ s3Uri }]) => stringifyS3Uri(s3Uri)))
                .size
        ).toBe(s.listObjects.mock.calls.length);
    });

    it.each(["s3://bucket/foo/a.csv", "s3://bucket/foo/"])(
        "renames %s within its current parent",
        async source => {
            const s = setup({
                "s3://bucket/foo/a.csv": "a",
                "s3://bucket/foo/nested/b.csv": "b"
            });
            await s.dispatch(
                thunks.rename({ s3Uri: uri(source), newBasename: "renamed" })
            );
            const target = source.endsWith("/")
                ? "s3://bucket/renamed/a.csv"
                : "s3://bucket/foo/renamed";
            expect(s.objects.get(target)).toBe("a");
            expect(s.objects.has("s3://bucket/foo/a.csv")).toBe(false);
            expect(s.operations()[0]).toMatchObject({
                type: "rename",
                newBasename: "renamed",
                status: "completed"
            });
            if (source.endsWith("/")) {
                expect(s.objects.get("s3://bucket/renamed/nested/b.csv")).toBe("b");
            }
        }
    );

    it("asks before merging a directory during rename", async () => {
        const s = setup({
            "s3://bucket/foo/a": "new",
            "s3://bucket/bar/a": "old",
            "s3://bucket/bar/b": "keep"
        });
        const questions: FileOperationConflict[] = [];
        evtFileOperationConflict.attach(ctx, conflict => {
            questions.push(conflict);
            assert(conflict.type === "directory");
            conflict.resolveResponse({ action: "merge", doRememberChoice: false });
        });
        await s.dispatch(
            thunks.rename({ s3Uri: uri("s3://bucket/foo/"), newBasename: "bar" })
        );
        expect(questions).toHaveLength(1);
        expect(questions[0].operationType).toBe("rename");
        expect(Object.fromEntries(s.objects)).toEqual({
            "s3://bucket/bar/a": "new",
            "s3://bucket/bar/b": "keep"
        });
    });

    it("does not mistake a key sharing the target name's prefix for an existing target", async () => {
        const s = setup({ "s3://bucket/x": "new", "s3://bucket/target/x.extra": "keep" });
        const handler = vi.fn();
        evtFileOperationConflict.attach(ctx, handler);
        await s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/x")],
                destinationS3Uri: prefix("s3://bucket/target/")
            })
        );
        expect(handler).not.toHaveBeenCalled();
        expect(s.objects.get("s3://bucket/target/x.extra")).toBe("keep");
        expect(s.objects.get("s3://bucket/target/x")).toBe("new");
    });

    it("renaming to the same name and an empty selection perform no mutations", async () => {
        const s = setup();
        await s.dispatch(
            thunks.copy({ s3Uris: [], destinationS3Uri: prefix("s3://bucket/xxx/") })
        );
        await s.dispatch(
            thunks.rename({ s3Uri: uri("s3://bucket/x.csv"), newBasename: "x.csv" })
        );
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.deleteObject).not.toHaveBeenCalled();
        expect(s.operations()).toHaveLength(1);
        expect(s.operations()[0].status).toBe("completed");
    });
});

describe("failures and cancellation", () => {
    it("cancels immediately when requested from the operation-start notification", async () => {
        const s = setup();
        s.store.evtAction.attach(
            action => action.actionName === "fileOperationStarted",
            ctx,
            ({ payload }) =>
                s.dispatch(
                    thunks.cancelFileOperation({ operationId: payload.operationId })
                )
        );
        await s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/foo/")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.listObjects).not.toHaveBeenCalled();
        expect(s.operations()[0].status).toBe("canceled");
    });

    it("cancels during recursive discovery without starting copies", async () => {
        const s = setup({ "s3://bucket/foo/nested/a": "a" });
        const dListing = new Deferred<void>();
        const dRelease = new Deferred<void>();
        const implementation = s.listObjects.getMockImplementation()!;
        s.listObjects.mockImplementation(async params => {
            if (stringifyS3Uri(params.s3Uri) === "s3://bucket/foo/nested/") {
                dListing.resolve();
                await dRelease.pr;
            }
            return implementation(params);
        });
        const pr = s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/foo/")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        await dListing.pr;
        s.dispatch(
            thunks.cancelFileOperation({ operationId: s.operations()[0].operationId })
        );
        dRelease.resolve();
        await pr;
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.deleteObject).not.toHaveBeenCalled();
        expect(s.operations()[0].status).toBe("canceled");
        expect(s.errors).toEqual([]);
    });

    it("records client initialization failures before execution", async () => {
        const s = setup();
        mocks.getS3Client.mockRejectedValueOnce(new Error("credentials expired"));
        await s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/foo/")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        expect(s.operations()[0]).toMatchObject({
            status: "errored",
            erroredErrorMessage: "credentials expired"
        });
        expect(s.errors).toEqual(["credentials expired"]);
        expect(s.copyObject).not.toHaveBeenCalled();
    });

    it.each([
        {
            sources: ["s3://bucket/foo/"],
            target: "s3://bucket/foo/nested/",
            message: "inside itself"
        },
        { sources: ["s3://bucket/x.csv"], target: "s3://bucket/", message: "different" },
        { sources: ["s3://bucket/"], target: "s3://other/", message: "bucket" },
        {
            sources: ["s3://bucket/missing"],
            target: "s3://bucket/xxx/",
            message: "does not exist"
        },
        {
            sources: ["s3://bucket/one/x", "s3://bucket/two/x"],
            target: "s3://bucket/xxx/",
            message: "same destination"
        },
        {
            sources: ["s3://bucket/foo/", "s3://bucket/xxx/foo/"],
            target: "s3://bucket/xxx/",
            message: "different"
        }
    ])(
        "rejects invalid operations before copying: $message",
        async ({ sources, target, message }) => {
            const s = setup({
                ...initialObjects,
                "s3://bucket/one/x": "one",
                "s3://bucket/two/x": "two"
            });
            await s.dispatch(
                thunks.move({
                    s3Uris: sources.map(uri),
                    destinationS3Uri: prefix(target)
                })
            );
            expect(s.errors[0]).toContain(message);
            expect(s.copyObject).not.toHaveBeenCalled();
            expect(s.deleteObject).not.toHaveBeenCalled();
            expect(s.operations()[0].status).toBe("errored");
        }
    );

    it.each(["", "a/b"])("rejects an invalid rename basename %j", async newBasename => {
        const s = setup();
        await s.dispatch(thunks.rename({ s3Uri: uri("s3://bucket/x.csv"), newBasename }));
        expect(s.errors[0]).toContain("single nonempty path segment");
        expect(s.copyObject).not.toHaveBeenCalled();
    });

    it.each(["source", "destination"])(
        "reports a failed %s listing and copies nothing",
        async which => {
            const s = setup();
            const implementation = s.listObjects.getMockImplementation()!;
            s.listObjects.mockImplementation(async params => {
                if (
                    stringifyS3Uri(params.s3Uri) ===
                    (which === "source" ? "s3://bucket/foo/" : "s3://bucket/xxx/")
                ) {
                    return {
                        isSuccess: false,
                        isKnownError: true,
                        errorCase: "access denied"
                    };
                }
                return implementation(params);
            });
            await s.dispatch(
                thunks.copy({
                    s3Uris: [uri("s3://bucket/foo/")],
                    destinationS3Uri: prefix("s3://bucket/xxx/")
                })
            );
            expect(s.errors[0]).toContain("access denied");
            expect(s.copyObject).not.toHaveBeenCalled();
            expect(s.operations()[0].status).toBe("errored");
        }
    );

    it("does not delete a failed copy's source and reports partial progress", async () => {
        const s = setup({ "s3://bucket/foo/a": "a", "s3://bucket/foo/b": "b" });
        s.copyObject.mockResolvedValueOnce({
            status: "failed",
            error: new Error("copy denied")
        });
        await s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/foo/")],
                destinationS3Uri: prefix("s3://bucket/target/")
            })
        );
        expect(s.objects.has("s3://bucket/foo/a")).toBe(true);
        expect(s.objects.has("s3://bucket/foo/b")).toBe(false);
        expect(
            s.deleteObject.mock.calls.map(([{ s3Uri }]) => stringifyS3Uri(s3Uri))
        ).toEqual(["s3://bucket/foo/b"]);
        const [operation] = s.operations();
        expect(operation.status).toBe("errored");
        expect(operation.objects[0]).toMatchObject({
            isCompleted: false,
            copyCompletionPercent: 0
        });
        expect(operation.objects[0].erroredErrorMessage).toContain("copy denied");
        expect(operation.objects[1].isCompleted).toBe(true);
        expect(s.errors).toHaveLength(1);
    });

    it("reports a failed source deletion while preserving the successful copy", async () => {
        const s = setup({ "s3://bucket/a": "a" });
        s.deleteObject.mockRejectedValueOnce(new Error("delete denied"));
        await s.dispatch(
            thunks.rename({ s3Uri: uri("s3://bucket/a"), newBasename: "b" })
        );
        expect(Object.fromEntries(s.objects)).toEqual({
            "s3://bucket/a": "a",
            "s3://bucket/b": "a"
        });
        expect(s.operations()[0]).toMatchObject({
            status: "errored",
            objects: [{ copyCompletionPercent: 100, isCompleted: false }]
        });
        expect(s.errors[0]).toContain("delete denied");
    });

    it("handles a thrown adapter copy error without deleting the source", async () => {
        const s = setup({ "s3://bucket/a": "a" });
        s.copyObject.mockRejectedValueOnce(new Error("connection lost"));
        await s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/a")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        expect(s.deleteObject).not.toHaveBeenCalled();
        expect(s.objects.get("s3://bucket/a")).toBe("a");
        expect(s.operations()[0].status).toBe("errored");
        expect(s.errors[0]).toContain("connection lost");
    });

    it("cancels a pending question and ignores its late response", async () => {
        const s = setup();
        const dQuestion = new Deferred<FileOperationConflict>();
        evtFileOperationConflict.attach(ctx, conflict => dQuestion.resolve(conflict));
        const pr = s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/x.csv")],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            })
        );
        const question = await dQuestion.pr;
        s.dispatch(thunks.cancelFileOperation({ operationId: question.operationId }));
        await pr;
        assert(question.type === "object");
        question.resolveResponse({ action: "overwrite", doRememberChoice: true });
        expect(s.copyObject).not.toHaveBeenCalled();
        expect(s.operations()[0].status).toBe("canceled");
        expect(s.errors).toEqual([]);
    });

    it("forwards cancellation to the active adapter call and stops subsequent copies/deletes", async () => {
        const s = setup({ "s3://bucket/foo/a": "a", "s3://bucket/foo/b": "b" });
        const dStarted = new Deferred<void>();
        s.copyObject.mockImplementationOnce(async ({ evtCancel, onCopyProgress }) => {
            const prCancel = evtCancel.waitFor();
            onCopyProgress({ copyPercent: 50 });
            dStarted.resolve();
            await prCancel;
            onCopyProgress({ copyPercent: 75 }); // Late progress must not update canceled state.
            return { status: "canceled" };
        });
        const pr = s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/foo/")],
                destinationS3Uri: prefix("s3://bucket/target/")
            })
        );
        await dStarted.pr;
        s.dispatch(
            thunks.cancelFileOperation({ operationId: s.operations()[0].operationId })
        );
        await pr;
        expect(s.copyObject).toHaveBeenCalledTimes(1);
        expect(s.deleteObject).not.toHaveBeenCalled();
        expect(s.operations()[0]).toMatchObject({
            status: "canceled",
            objects: [{ copyCompletionPercent: 50 }, { copyCompletionPercent: 0 }]
        });
        expect(s.errors).toEqual([]);
    });

    it("flushes finished operations without discarding an active operation", async () => {
        const s = setup();
        await s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/x.csv")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        const dQuestion = new Deferred<FileOperationConflict>();
        evtFileOperationConflict.attach(ctx, conflict => dQuestion.resolve(conflict));
        const pr = s.dispatch(
            thunks.copy({
                s3Uris: [uri("s3://bucket/x.csv")],
                destinationS3Uri: prefix("s3://bucket/xxx/")
            })
        );
        const question = await dQuestion.pr;
        s.dispatch(thunks.flushFileOperations());
        expect(s.operations()).toHaveLength(1);
        expect(s.operations()[0].status).toBe("running");
        question.resolveResponse({ action: "cancel" });
        await pr;
        s.dispatch(thunks.cancelFileOperation({ operationId: question.operationId }));
        s.dispatch(thunks.flushFileOperations());
        expect(s.operations()).toEqual([]);
    });

    it("keeps operations independent when canceling one of two concurrent moves", async () => {
        const s = setup({ "s3://bucket/a": "a", "s3://bucket/b": "b" });
        const dBothStarted = new Deferred<void>();
        const dRelease = new Deferred<void>();
        const implementation = s.copyObject.getMockImplementation()!;
        let started = 0;
        s.copyObject.mockImplementation(async params => {
            if (++started === 2) {
                dBothStarted.resolve();
            }
            await dRelease.pr;
            if (params.evtCancel.postCount !== 0) {
                return { status: "canceled" };
            }
            return implementation(params);
        });
        const first = s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/a")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        const second = s.dispatch(
            thunks.move({
                s3Uris: [uri("s3://bucket/b")],
                destinationS3Uri: prefix("s3://other/")
            })
        );
        await dBothStarted.pr;
        s.dispatch(
            thunks.cancelFileOperation({ operationId: s.operations()[0].operationId })
        );
        dRelease.resolve();
        await Promise.all([first, second]);
        expect(s.operations().map(operation => operation.status)).toEqual([
            "canceled",
            "completed"
        ]);
        expect(Object.fromEntries(s.objects)).toEqual({
            "s3://bucket/a": "a",
            "s3://other/b": "b"
        });
        expect(s.errors).toEqual([]);
    });

    it("reports progress while copying and refreshes the location displayed at completion", async () => {
        const s = setup({ "s3://bucket/a": "a" });
        s.dispatch(
            actions.listingStarted({
                profileName: "default",
                s3Uri: prefix("s3://bucket/")
            })
        );
        const refresh = vi
            .spyOn(thunks, "listPrefix")
            .mockImplementation(() => async () => undefined);
        const dStarted = new Deferred<void>();
        const dRelease = new Deferred<void>();
        const implementation = s.copyObject.getMockImplementation()!;
        s.copyObject.mockImplementationOnce(async params => {
            params.onCopyProgress({ copyPercent: 10 });
            dStarted.resolve();
            await dRelease.pr;
            return implementation(params);
        });
        try {
            const pr = s.dispatch(
                thunks.copy({
                    s3Uris: [uri("s3://bucket/a")],
                    destinationS3Uri: prefix("s3://other/")
                })
            );
            await dStarted.pr;
            expect(s.operations()[0]).toMatchObject({
                status: "running",
                isListingComplete: true,
                objects: [{ copyCompletionPercent: 10 }]
            });
            const newLocation = prefix("s3://other/");
            s.dispatch(
                actions.listingStarted({ profileName: "default", s3Uri: newLocation })
            );
            dRelease.resolve();
            await pr;
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(refresh).toHaveBeenCalledWith({
                s3Uri: newLocation,
                debounce: false
            });
            expect(s.operations()[0].status).toBe("completed");
        } finally {
            refresh.mockRestore();
        }
    });
});

describe("upload overwrite event migration", () => {
    it.each(["overwrite", "skip"] as const)("keeps upload %s behavior", async action => {
        const s = setup({ "s3://bucket/a": "existing" });
        evtAskOverwriteConfirmation.attach(ctx, question =>
            question.resolveResponse({ action, doRememberChoice: false })
        );
        const dispatchProxy = vi.fn(async () => undefined);
        await s.dispatch(
            privateThunks.putObject({
                profileName: "default",
                s3Uri: object("s3://bucket/a"),
                blob: new Blob(["new"]),
                doCheckExistence: true,
                dispatchProxy
            })
        );
        expect(s.putObject).toHaveBeenCalledTimes(action === "overwrite" ? 1 : 0);
        expect(s.deleteObject).toHaveBeenCalledTimes(action === "overwrite" ? 1 : 0);
        expect(dispatchProxy).toHaveBeenCalledTimes(action === "overwrite" ? 1 : 0);
    });
});
