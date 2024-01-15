import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { routes } from "ui/routes";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type MyFilesDisabledDialogProps = {
    evtOpen: NonPostableEvt<void>;
};

export const MyFilesDisabledDialog = memo((props: MyFilesDisabledDialogProps) => {
    const { evtOpen } = props;

    const [isOpen, setIsOpen] = useState(false);

    useEvt(ctx => evtOpen.attach(ctx, () => setIsOpen(true)), [evtOpen]);

    const onClose = () => setIsOpen(false);

    const { t } = useTranslation({ MyFilesDisabledDialog });

    return (
        <Dialog
            title={t("dialog title")}
            isOpen={isOpen}
            onClose={onClose}
            body={t("dialog body")}
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        autoFocus
                        doOpenNewTabIfHref={false}
                        {...(() => {
                            const link = routes.projectSettings({
                                "tabId": "s3-configs"
                            }).link;

                            return {
                                ...link,
                                "onClick": () => {
                                    onClose();
                                    return link.onClick();
                                }
                            };
                        })()}
                    >
                        {t("go to settings")}
                    </Button>
                </>
            }
        />
    );
});

export const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "cancel" | "go to settings"
>()({ MyFilesDisabledDialog });
