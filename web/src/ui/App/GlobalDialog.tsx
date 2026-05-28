import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import type { LocalizedString } from "ui/i18n";
import { Dialog } from "onyxia-ui/Dialog";
import { LocalizedMarkdown } from "ui/shared/Markdown";

// eslint-disable-next-line react-refresh/only-export-components
export const evtGlobalDialog = Evt.create<{
    body: LocalizedString;
}>();

export function GlobalDialog() {
    const [state, setState] = useState<
        | {
              body: LocalizedString;
          }
        | undefined
    >(undefined);

    useEvt(ctx => {
        evtGlobalDialog.attach(ctx, ({ body }) => {
            setState({ body });
        });
    }, []);

    return (
        <Dialog
            isOpen={state !== undefined}
            body={
                state !== undefined && (
                    <LocalizedMarkdown onLinkClick={() => setState(undefined)}>
                        {state.body}
                    </LocalizedMarkdown>
                )
            }
            onClose={() => setState(undefined)}
            showCloseButton
        />
    );
}
