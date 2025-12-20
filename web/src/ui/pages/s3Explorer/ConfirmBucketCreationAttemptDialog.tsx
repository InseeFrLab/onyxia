import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type ConfirmBucketCreationAttemptDialogProps = {
    evtOpen: NonPostableEvt<{
        bucket: string;
        createBucket: () => Promise<{ isSuccess: boolean }>;
    }>;
};

export const ConfirmBucketCreationAttemptDialog = memo(
    (props: ConfirmBucketCreationAttemptDialogProps) => {
        const { evtOpen } = props;

        const { t } = useTranslation({ ConfirmBucketCreationAttemptDialog });

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
                    title={
                        state === undefined
                            ? ""
                            : t("bucket does not exist title", { bucket: state.bucket })
                    }
                    body={t("bucket does not exist body")}
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
                                    {t("no")}
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
                                    {t("yes")}
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
                    title={
                        state?.isBucketCreationSuccess
                            ? t("success title")
                            : t("failed title")
                    }
                    body={
                        state === undefined
                            ? ""
                            : state.isBucketCreationSuccess
                              ? t("success body", { bucket: state.bucket })
                              : t("failed body", { bucket: state.bucket })
                    }
                    buttons={
                        <Button autoFocus onClick={() => setState(undefined)}>
                            {t("ok")}
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

const { i18n } = declareComponentKeys<
    | { K: "bucket does not exist title"; P: { bucket: string } }
    | "bucket does not exist body"
    | "no"
    | "yes"
    | "success title"
    | "failed title"
    | { K: "success body"; P: { bucket: string } }
    | { K: "failed body"; P: { bucket: string } }
    | "ok"
>()({ ConfirmBucketCreationAttemptDialog });

export type I18n = typeof i18n;
