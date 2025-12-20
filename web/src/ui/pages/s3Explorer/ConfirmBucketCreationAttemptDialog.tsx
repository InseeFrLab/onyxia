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
                  isBucketCreationSuccess: boolean | undefined;
                  isCreatingBucket: boolean;
              })
            | undefined
        >(undefined);

        useEvt(
            ctx => {
                evtOpen.attach(ctx, eventData =>
                    setState({
                        ...eventData,
                        isBucketCreationSuccess: undefined,
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

                                        setState(state => {
                                            assert(state !== undefined);

                                            return {
                                                ...state,
                                                isCreatingBucket: false,
                                                isBucketCreationSuccess: isSuccess
                                            };
                                        });
                                    }}
                                >
                                    Yes
                                </Button>
                            </>
                        );
                    })()}
                    isOpen={
                        state !== undefined && state.isBucketCreationSuccess === undefined
                    }
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
                    title={state?.isBucketCreationSuccess ? "Success" : "Failed"}
                    body={
                        state?.isBucketCreationSuccess
                            ? `Bucket ${state.bucket} successfully created.`
                            : `Failed to create ${state?.bucket}.`
                    }
                    buttons={
                        <Button autoFocus onClick={() => setState(undefined)}>
                            Ok
                        </Button>
                    }
                    isOpen={
                        state !== undefined && state.isBucketCreationSuccess !== undefined
                    }
                    onClose={() => setState(undefined)}
                />
            </>
        );
    }
);

ConfirmBucketCreationAttemptDialog.displayName = symToStr({
    ConfirmBucketCreationAttemptDialog
});
