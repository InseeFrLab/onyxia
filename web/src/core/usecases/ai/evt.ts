import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { evtDisplayError, type AiInitializationError } from "./thunks";

export type AiEvent =
    | {
          action: "display error";
          error: AiInitializationError;
      }
    | undefined;

export const createEvt = (() => {
    // Stateful so an error emitted synchronously while the core is bootstrapping is
    // still available when the React application mounts.
    const evt = Evt.create<AiEvent>(undefined);

    evtDisplayError.attach(error => {
        evt.post({
            action: "display error",
            error
        });
    });

    return evt;
}) satisfies CreateEvt;
