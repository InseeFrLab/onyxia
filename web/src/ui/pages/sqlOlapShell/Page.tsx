import "xterm/css/xterm.css";
import { useState, useEffect } from "react";
import { useConst } from "powerhooks/useConst";
import { tss } from "tss";
import { useCoreState, useCore } from "core";
import { useRoute } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import * as duckdbWasmShell from "@duckdb/duckdb-wasm-shell";
import shellBgWasmUrl from "@duckdb/duckdb-wasm-shell/dist/shell_bg.wasm?url";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

const Page = withLoginEnforced(SqlOlapShell);
export default Page;

function SqlOlapShell() {
    const route = useRoute();
    assert(routeGroup.has(route));

    const isReady = useCoreState("sqlOlapShell", "isReady");
    const { sqlOlapShell } = useCore().functions;

    useEffect(() => {
        sqlOlapShell.initialize();
    }, []);

    const { classes } = useStyles();

    if (!isReady) {
        return (
            <div className={classes.initializing}>
                <CircularProgress size={70} />
            </div>
        );
    }

    return <ReadySqlOlapShell />;
}

function ReadySqlOlapShell() {
    const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

    const { classes } = useStyles();

    const isEmbeddedByElement = useConst(() => new WeakMap<HTMLElement, true>());

    const { sqlOlapShell } = useCore().functions;

    useEffect(() => {
        if (containerElement === null) {
            return;
        }

        if (isEmbeddedByElement.has(containerElement)) {
            return;
        }

        const db = sqlOlapShell.getDb();

        duckdbWasmShell.embed({
            shellModule: shellBgWasmUrl,
            container: containerElement,
            resolveDatabase: async () => db
        });

        isEmbeddedByElement.set(containerElement, true);
    }, [containerElement]);

    return (
        <div className={classes.root}>
            <div ref={setContainerElement} />;
        </div>
    );
}

const useStyles = tss.withName({ SqlOlapShell }).create(({ theme }) => ({
    initializing: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    },
    root: {
        height: "100%",
        overflow: "hidden",
        padding: "16px 0 0 20px",
        backgroundColor: "#333333",
        borderRadius: 10,
        boxShadow: theme.shadows[1]
    }
}));
