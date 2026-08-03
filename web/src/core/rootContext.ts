import type { Context } from "./bootstrap";
import { assert } from "tsafe";

let value: Context | undefined = undefined;

export function getRootContext(): Context {
    assert(value !== undefined, "getRootContext was called before context was set");

    return value;
}

export function setRootContext(rootContext: Context) {
    assert(value === undefined);

    value = rootContext;
}
