import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCore } from "clean-architecture";
import type { GitRepository } from "core/ports/GitForge";
import { assert } from "tsafe/assert";

/**
 * The neighbours, faked: the launcher holds the helm values, gitForgesManagement the
 * connected forges and the requests to the forge.
 */
const fakes = vi.hoisted(() => ({
    listRepositories: undefined as unknown as ReturnType<typeof vi.fn>,
    listBranches: undefined as unknown as ReturnType<typeof vi.fn>
}));

vi.mock("core/usecases/launcher", async () => {
    const { createUsecaseActions } = await import("clean-architecture");
    const { assignValueAtPath } = await import("core/tools/Stringifyable");

    const { reducer, actions } = createUsecaseActions({
        name: "launcher",
        initialState: { helmValues: null as Record<string, any> | null },
        reducers: {
            helmValuesSet: (
                state,
                { payload }: { payload: Record<string, any> | null }
            ) => {
                state.helmValues = payload;
            },
            formFieldValueChanged: (
                state,
                {
                    payload
                }: { payload: { helmValuesPath: (string | number)[]; value: any } }
            ) => {
                assert(state.helmValues !== null);
                assignValueAtPath({
                    stringifyableObjectOrArray: state.helmValues,
                    path: payload.helmValuesPath,
                    value: payload.value
                });
            }
        }
    });

    return {
        name: "launcher",
        reducer,
        actions,
        selectors: {},
        createEvt: undefined,
        protectedSelectors: {
            helmValues: (state: any) => state.launcher.helmValues
        },
        thunks: {
            changeFormFieldValue:
                ({ formFieldValue }: { formFieldValue: any }) =>
                (dispatch: any) =>
                    dispatch(actions.formFieldValueChanged(formFieldValue))
        }
    };
});

vi.mock("core/usecases/gitForgesManagement", async () => {
    const { createUsecaseActions } = await import("clean-architecture");

    const { reducer, actions } = createUsecaseActions({
        name: "gitForgesManagement",
        initialState: { connectedForges: undefined as any[] | undefined },
        reducers: {
            connectedForgesSet: (state, { payload }: { payload: any[] }) => {
                state.connectedForges = payload;
            }
        }
    });

    return {
        name: "gitForgesManagement",
        reducer,
        actions,
        createEvt: undefined,
        selectors: {
            connectedForges: (state: any) => state.gitForgesManagement.connectedForges
        },
        thunks: {
            listRepositories: (params: any) => () => fakes.listRepositories(params),
            listBranches: (params: any) => () => fakes.listBranches(params)
        }
    };
});

vi.mock("core/usecases/gitAccountUiController", () => ({
    selectors: {
        disconnectedForges: (state: any) =>
            state.gitForgesManagement.connectedForges === undefined ? undefined : []
    }
}));

const gitLab = {
    forgeId: "gitlab",
    displayName: "GitLab",
    type: "gitlab",
    url: "https://gitlab.lan",
    logoUrl: undefined,
    username: "jdoe"
};

const createRepository = (fullPath: string): GitRepository => ({
    id: fullPath,
    name: fullPath,
    fullPath,
    description: undefined,
    webUrl: `https://gitlab.lan/${fullPath}`,
    httpCloneUrl: `https://gitlab.lan/${fullPath}.git`,
    defaultBranch: "main"
});

async function setup() {
    const controller = await import("./index");
    const launcher = await import("core/usecases/launcher");
    const management = await import("core/usecases/gitForgesManagement");

    const { core, dispatch, getState } = createCore({
        context: {} as never,
        usecases: {
            gitRepositoryFieldUiController: controller,
            launcher: launcher as never,
            gitForgesManagement: management as never
        }
    });

    (dispatch as any)(
        (launcher as any).actions.helmValuesSet({
            git: { forgeId: "", url: "", branch: "", depth: 1 }
        })
    );

    const connect = () =>
        (dispatch as any)((management as any).actions.connectedForgesSet([gitLab]));

    const { fieldId, cleanup } = core.functions.gitRepositoryFieldUiController.initialize(
        { helmValuesPath: ["git"], isReadonly: false }
    );

    const getView = () => {
        const view = controller.selectors.viewByFieldId(getState() as never)[fieldId];
        assert(view !== undefined);
        return view;
    };

    const getHelmValue = () => (getState() as any).launcher.helmValues.git;

    /** As the yaml editor would */
    const setHelmValue = (git: Record<string, unknown>) =>
        (dispatch as any)((launcher as any).actions.helmValuesSet({ git }));

    return {
        functions: core.functions.gitRepositoryFieldUiController,
        fieldId,
        cleanup,
        connect,
        getView,
        getHelmValue,
        setHelmValue
    };
}

beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    fakes.listRepositories = vi.fn(async ({ search, page }) => ({
        repositories:
            page === 1
                ? [createRepository(`group/${search || "project"}`)]
                : [createRepository("group/older")],
        hasNextPage: page === 1
    }));
    fakes.listBranches = vi.fn(async () => ["main", "dev"]);
});

afterEach(() => {
    vi.useRealTimers();
});

describe("gitRepositoryFieldUiController", () => {
    it("lists the recent repositories once the forges are known", async () => {
        const { connect, getView } = await setup();

        expect(getView().forgePicker.status).toBe("loading");
        expect(fakes.listRepositories).not.toHaveBeenCalled();

        connect();

        await vi.advanceTimersByTimeAsync(0);

        expect(fakes.listRepositories).toHaveBeenCalledTimes(1);
        expect(fakes.listRepositories.mock.calls[0][0]).toMatchObject({
            forgeId: "gitlab",
            search: "",
            page: 1
        });

        const picker = getView().forgePicker;
        assert(picker.status === "ready");
        expect(picker.isSearching).toBe(false);
        expect(picker.repositoryList?.repositories.map(r => r.fullPath)).toEqual([
            "group/project"
        ]);
    });

    it("debounces the search, and aborts the one no longer needed", async () => {
        const { connect, functions, fieldId } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeSearch({ fieldId, search: "a" });
        await vi.advanceTimersByTimeAsync(100);
        functions.changeSearch({ fieldId, search: "ab" });
        await vi.advanceTimersByTimeAsync(299);

        expect(fakes.listRepositories).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);

        expect(fakes.listRepositories).toHaveBeenCalledTimes(2);
        expect(fakes.listRepositories.mock.calls[1][0].search).toBe("ab");
    });

    it("writes the picked repository, then lists its branches", async () => {
        const { connect, functions, fieldId, getView, getHelmValue } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        const picker = getView().forgePicker;
        assert(picker.status === "ready" && picker.repositoryList !== undefined);

        functions.pickRepository({
            fieldId,
            repository: picker.repositoryList.repositories[0]
        });

        expect(getHelmValue()).toMatchObject({
            forgeId: "gitlab",
            url: "https://gitlab.lan/group/project.git",
            branch: "main"
        });

        expect(getView().branch.isLoading).toBe(true);

        await vi.advanceTimersByTimeAsync(300);

        expect(fakes.listBranches).toHaveBeenCalledTimes(1);
        expect(getView().branch.branches).toEqual(["main", "dev"]);

        functions.changeBranch({ fieldId, branch: "dev" });

        expect(getHelmValue().branch).toBe("dev");

        functions.clearRepository({ fieldId });

        expect(getHelmValue().url).toBe("");
        expect(getView().branch).toMatchObject({ isDisabled: true, branches: [] });
    });

    it("asks for more, and again after a failure", async () => {
        const { connect, functions, fieldId, getView } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        fakes.listRepositories.mockRejectedValueOnce(new Error("Network error"));

        functions.requestMoreRepositories({ fieldId });
        await vi.advanceTimersByTimeAsync(0);

        expect(getView().error).toBe("search failed");

        functions.requestMoreRepositories({ fieldId });
        await vi.advanceTimersByTimeAsync(0);

        expect(fakes.listRepositories).toHaveBeenCalledTimes(3);
        expect(getView().error).toBe(undefined);

        const picker = getView().forgePicker;
        assert(picker.status === "ready");
        expect(picker.repositoryList?.repositories.map(r => r.fullPath)).toEqual([
            "group/project",
            "group/older"
        ]);
        expect(picker.repositoryList?.isMoreAvailable).toBe(false);
    });

    it("writes a typed url once it is one, never with credentials", async () => {
        const { connect, functions, fieldId, getView, getHelmValue } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeUrlInput({ fieldId, urlInput: "https://example.org" });

        expect(getView().mode).toBe("url");
        expect(getView().urlInput.text).toBe("https://example.org");
        expect(getHelmValue().url).toBe("");

        functions.changeUrlInput({ fieldId, urlInput: "https://example.org/o/r.git" });

        expect(getHelmValue()).toMatchObject({
            forgeId: "",
            url: "https://example.org/o/r.git"
        });
        expect(getView().urlInput.isAnonymous).toBe(true);

        functions.changeUrlInput({
            fieldId,
            urlInput: "https://u:t@example.org/o/r.git"
        });

        expect(getHelmValue().url).toBe("");
        expect(getView().urlInput).toMatchObject({
            text: "https://u:t@example.org/o/r.git",
            hasCredentials: true
        });
    });

    it("pastes a url in the search", async () => {
        const { connect, functions, fieldId, getView, getHelmValue } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeSearch({ fieldId, search: "https://gitlab.lan/group/x.git" });

        expect(getView().mode).toBe("url");
        expect(getHelmValue()).toMatchObject({
            forgeId: "gitlab",
            url: "https://gitlab.lan/group/x.git"
        });
    });

    it("follows a value changed elsewhere, keeps a draft", async () => {
        const { connect, functions, fieldId, getView, setHelmValue } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeUrlInput({ fieldId, urlInput: "https://a.or" });

        setHelmValue({ forgeId: "", url: "", branch: "dev" });

        // NOTE: Not a url yet, the value is empty: the draft stays.
        expect(getView().urlInput.text).toBe("https://a.or");

        setHelmValue({ forgeId: "", url: "https://b.org/o/r", branch: "" });

        expect(getView().urlInput.text).toBe("https://b.org/o/r");
    });

    it("empties the repository of the previous profile", async () => {
        const { connect, functions, fieldId, getView, getHelmValue } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeUrlInput({ fieldId, urlInput: "https://a.org/o/r" });

        expect(getHelmValue().url).toBe("https://a.org/o/r");

        functions.selectForge({ fieldId, forgeId: "gitlab" });

        expect(getHelmValue().url).toBe("");
        expect(getView().urlInput.text).toBe("");
    });

    it("stops everything on cleanup", async () => {
        const { connect, functions, fieldId, cleanup } = await setup();

        connect();
        await vi.advanceTimersByTimeAsync(0);

        functions.changeSearch({ fieldId, search: "x" });

        cleanup();

        await vi.advanceTimersByTimeAsync(1000);

        expect(fakes.listRepositories).toHaveBeenCalledTimes(1);
    });
});
