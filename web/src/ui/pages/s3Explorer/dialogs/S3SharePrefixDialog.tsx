import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { S3SharePrefixDialog as S3SharePrefixDialog_headless } from "ui/shared/codex/S3SharePrefixDialog";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";

export type S3SharePrefixDialogProps = {
    evtOpen: Evt<{
        prefixName: string;
        link: Link;
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

    return (
        <Dialog
            maxWidth="xl"
            title={t("dialog title")}
            body={
                state === undefined ? undefined : (
                    <S3SharePrefixDialog_headless
                        prefixName={state.prefixName}
                        url={state.link.href}
                    />
                )
            }
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
