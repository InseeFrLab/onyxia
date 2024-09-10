import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
    evtOpen: NonPostableEvt<{
        resolveDoProceed: (doProceed: boolean) => void;
    }>;
};

export const ConfirmCustomS3ConfigDeletionDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const [state, setState] = useState<UnpackEvt<Props["evtOpen"]> | undefined>(
        undefined
    );

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ resolveDoProceed }) => setState({ resolveDoProceed }));
        },
        [evtOpen]
    );

    const onCloseFactory = useCallbackFactory(([doProceed]: [boolean]) => {
        assert(state !== undefined);

        state.resolveDoProceed(doProceed);

        setState(undefined);
    });

    return (
        <Dialog
            title="Confirm deletion of custom S3 config ?"
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} autoFocus variant="secondary">
                        Cancel
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        Yes
                    </Button>
                </>
            }
            isOpen={state !== undefined}
            onClose={onCloseFactory(false)}
        />
    );
});

ConfirmCustomS3ConfigDeletionDialog.displayName = symToStr({
    ConfirmCustomS3ConfigDeletionDialog
});
