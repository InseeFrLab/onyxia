import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";

export type DisplayErrorDialogProps = {
    evtOpen: Evt<{
        errorMessage: string;
    }>;
};

export const DisplayErrorDialog = memo((props: DisplayErrorDialogProps) => {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<DisplayErrorDialogProps["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => setState(eventData));
        },
        [evtOpen]
    );

    return (
        <Dialog
            title="Error"
            body={state?.errorMessage ?? ""}
            buttons={
                <Button autoFocus onClick={() => setState(undefined)}>
                    Ok
                </Button>
            }
            isOpen={state !== undefined}
            onClose={() => setState(undefined)}
        />
    );
});

DisplayErrorDialog.displayName = symToStr({
    DisplayErrorDialog
});
