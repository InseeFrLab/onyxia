import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { S3SharePrefixDialog as S3SharePrefixDialog_headless } from "ui/shared/codex/S3SharePrefixDialog";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

export type S3SharePrefixDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.TerminatedByDelimiter;
        anonymousProfileName: string;
    }>;
};

export function S3SharePrefixDialog(props: S3SharePrefixDialogProps) {
    return <S3SharePrefixDialogContainer {...props} />;
}

function S3SharePrefixDialogContainer(props: S3SharePrefixDialogProps) {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<S3SharePrefixDialogProps["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => setState(eventData));
        },
        [evtOpen]
    );

    const { t } = useTranslation({ S3SharePrefixDialogContainer });

    const body = (() => {
        if (state === undefined) {
            return undefined;
        }

        const prefixBasename = state.s3Uri.keySegments.at(-1);

        const onyxiaUrl =
            window.location.origin +
            routes.s3Explorer({
                s3UriWithoutScheme: stringifyS3Uri(state.s3Uri).slice("s3://".length),
                profile: state.anonymousProfileName
            }).link.href;

        return (
            <S3SharePrefixDialog_headless
                prefixBasename={prefixBasename}
                onyxiaUrl={onyxiaUrl}
            />
        );
    })();

    return (
        <Dialog
            maxWidth="xl"
            title={t("dialog title")}
            body={body}
            isOpen={state !== undefined}
            onClose={() => setState(undefined)}
            showCloseButton
        />
    );
}

const { i18n } = declareComponentKeys<"dialog title">()({
    S3SharePrefixDialogContainer
});
export type I18n = typeof i18n;
