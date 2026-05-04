import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useState } from "react";
import { withLoader } from "ui/tools/withLoader";
import { getCore, useCoreState, getCoreSync } from "core";
import type { S3Uri } from "core/tools/S3Uri";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { S3ShareObjectDialog as S3ShareObjectDialog_headless } from "ui/shared/codex/S3ShareObjectDialog";

export type S3ShareObjectDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }>;
};

export function S3ShareObjectDialog(props: S3ShareObjectDialogProps) {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<S3ShareObjectDialogProps["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => setState(eventData));
        },
        [evtOpen]
    );

    return (
        <Dialog
            title="Share Object"
            body={state === undefined ? undefined : <Body s3Uri={state.s3Uri} />}
            buttons={
                <Button autoFocus onClick={() => setState(undefined)}>
                    Close
                </Button>
            }
            isOpen={state !== undefined}
            onClose={() => setState(undefined)}
        />
    );
}

const Body = withLoader<{
    s3Uri: S3Uri.NonTerminatedByDelimiter;
}>({
    loader: async ({ s3Uri }) => {
        const core = await getCore();
        core.functions.s3ShareObjectUiController.load({ s3Uri });
    },
    FallbackComponent: () => null,
    Component: () => {
        const mainView = useCoreState("s3ShareObjectUiController", "mainView");

        const {
            functions: { s3ShareObjectUiController }
        } = getCoreSync();

        return (
            <S3ShareObjectDialog_headless
                objectBasename={mainView.objectBasename}
                httpUrl={mainView.httpUrl}
                {...(mainView.isPublic === true
                    ? {
                          isPublic: true
                      }
                    : {
                          isPublic: mainView.isPublic,
                          validityDuration: mainView.validityDuration,
                          changeValidityDuration:
                              s3ShareObjectUiController.changeValidityDuration
                      })}
            />
        );
    }
});
