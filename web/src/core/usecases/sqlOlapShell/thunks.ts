import type { Thunks } from "core/bootstrap";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import shellBgWasmUrl from "@duckdb/duckdb-wasm-shell/dist/shell_bg.wasm?url";
import { assert } from "tsafe";

let globals:
    | {
          db: AsyncDuckDB;
          embeddedElements: WeakSet<HTMLDivElement>;
          duckdbWasmShell: typeof import("@duckdb/duckdb-wasm-shell");
      }
    | undefined = undefined;

export const thunks = {
    load:
        () =>
        async (...args) => {
            const [, , { sqlOlap }] = args;

            const [db, duckdbWasmShell] = await Promise.all([
                sqlOlap.getConfiguredAsyncDuckDb(),
                import("@duckdb/duckdb-wasm-shell")
            ]);

            globals = {
                db,
                embeddedElements: new WeakSet(),
                duckdbWasmShell
            };
        },
    setDuckDbWasmShellPlaceholderElement:
        (params: {
            placeholderElement: HTMLDivElement | null;
            backgroundColor: string;
        }) =>
        () => {
            const { placeholderElement, backgroundColor } = params;
            if (placeholderElement === null) {
                return;
            }

            assert(globals !== undefined);

            const { db, embeddedElements, duckdbWasmShell } = globals;

            if (embeddedElements.has(placeholderElement)) {
                return;
            }

            duckdbWasmShell.embed({
                shellModule: shellBgWasmUrl,
                container: placeholderElement,
                backgroundColor,
                resolveDatabase: () => Promise.resolve(db)
            });
        }
} satisfies Thunks;
