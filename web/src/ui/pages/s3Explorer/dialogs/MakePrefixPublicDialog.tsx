import { memo, useRef, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";

export type MakePrefixPublicDialogProps = {
    evtOpen: Evt<{
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const MakePrefixPublicDialog = memo((props: MakePrefixPublicDialogProps) => {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<MakePrefixPublicDialogProps["evtOpen"]> | undefined
    >(undefined);
    const stateRef = useRef<typeof state>(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => {
                stateRef.current?.resolveDoProceed(false);
                stateRef.current = eventData;
                setState(eventData);
            });
        },
        [evtOpen]
    );

    const close = (doProceed: boolean) => {
        const state = stateRef.current;

        if (state === undefined) {
            return;
        }

        stateRef.current = undefined;
        setState(undefined);

        state.resolveDoProceed(doProceed);
    };

    return (
        <Dialog
            title="Make prefix public"
            body={
                <>
                    You&apos;re about to make this prefix public. This means that anyone
                    will be able to list all present and future objects it contains and
                    download them freely.
                    <br />
                    <br />
                    When you share download links, they won&apos;t be signed and will
                    never expire.
                </>
            }
            buttons={
                <>
                    <Button autoFocus variant="secondary" onClick={() => close(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => close(true)}>Make public</Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={() => close(false)}
        />
    );
});

MakePrefixPublicDialog.displayName = symToStr({
    MakePrefixPublicDialog
});
