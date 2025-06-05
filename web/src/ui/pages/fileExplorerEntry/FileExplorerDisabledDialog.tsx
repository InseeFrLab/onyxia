import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { routes } from "ui/routes";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export const FileExplorerDisabledDialog = memo(() => {
    const onClose = () => routes.home().push();
    const { t } = useTranslation({ FileExplorerDisabledDialog });

    return (
        <Dialog
            title={t("dialog title")}
            isOpen={true}
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
                                tabId: "s3-configs"
                            }).link;
                            return {
                                ...link,
                                onClick: e => {
                                    onClose();
                                    return link.onClick(e);
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

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "cancel" | "go to settings"
>()({ FileExplorerDisabledDialog });

export type I18n = typeof i18n;
