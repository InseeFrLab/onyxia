import type { CreateEvt } from "core/bootstrap";
import { name } from "./state";

/** Errors the user has to be told about, they are surfaced by a global dialog. */
export type AiInitializationError =
    | { kind: "config-restoration-failed" | "initialization-failed" }
    | { kind: "authentication-failed" | "models-fetch-failed"; providerName: string };

export const createEvt = (({ evtAction }) =>
    evtAction.pipe(action =>
        action.usecaseName === name && action.actionName === "errorNotified"
            ? [{ action: "display error" as const, error: action.payload }]
            : null
    )) satisfies CreateEvt;
