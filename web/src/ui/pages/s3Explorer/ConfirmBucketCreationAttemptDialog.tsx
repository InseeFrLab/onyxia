import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularProgress } from "onyxia-ui/CircularProgress";

export type ConfirmBucketCreationAttemptDialogProps = {
    evtOpen: NonPostableEvt<{
        bucket: string;
        createBucket: () => Promise<{ isSuccess: boolean }>;
    }>;
};

export const ConfirmBucketCreationAttemptDialog = memo(
    (props: ConfirmBucketCreationAttemptDialogProps) => {
        const { evtOpen } = props;

        const [state, setState] = useState<
            | (UnpackEvt<ConfirmBucketCreationAttemptDialogProps["evtOpen"]> & {
                  isBucketCreationFailed: boolean;
                  isCreatingBucket: boolean;
              })
            | undefined
        >(undefined);

        useEvt(
            ctx => {
                evtOpen.attach(ctx, eventData =>
                    setState({
                        ...eventData,
                        isBucketCreationFailed: false,
                        isCreatingBucket: false
                    })
                );
            },
            [evtOpen]
        );

        return (
            <>
                <Dialog
                    title={`The ${state?.bucket} bucket does not exist`}
                    body={`Do you want to attempt creating it now?`}
                    buttons={(() => {
                        if (state === undefined) {
                            return null;
                        }

                        if (state.isCreatingBucket) {
                            return <CircularProgress />;
                        }

                        return (
                            <>
                                <Button
                                    onClick={() => setState(undefined)}
                                    autoFocus
                                    variant="secondary"
                                >
                                    No
                                </Button>
                                <Button
                                    autoFocus
                                    onClick={async () => {
                                        setState(state => {
                                            assert(state !== undefined);

                                            return {
                                                ...state,
                                                isCreatingBucket: true
                                            };
                                        });

                                        assert(state !== undefined);

                                        const { isSuccess } = await state.createBucket();

                                        if (isSuccess) {
                                            setState(undefined);
                                            return;
                                        }

                                        setState(state => {
                                            assert(state !== undefined);

                                            return {
                                                ...state,
                                                isCreatingBucket: false,
                                                isBucketCreationFailed: true
                                            };
                                        });
                                    }}
                                >
                                    Yes
                                </Button>
                            </>
                        );
                    })()}
                    isOpen={state !== undefined && !state.isBucketCreationFailed}
                    onClose={() => {
                        if (state === undefined) {
                            return;
                        }

                        if (state.isCreatingBucket) {
                            return;
                        }

                        setState(undefined);
                    }}
                />
                <Dialog
                    title={`Bucket creation failed`}
                    buttons={
                        <Button autoFocus onClick={() => setState(undefined)}>
                            Ok
                        </Button>
                    }
                    isOpen={state !== undefined && state.isBucketCreationFailed}
                    onClose={() => setState(undefined)}
                />
            </>
        );
    }
);

ConfirmBucketCreationAttemptDialog.displayName = symToStr({
    ConfirmBucketCreationAttemptDialog
});
