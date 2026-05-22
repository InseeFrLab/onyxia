import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type ConfirmAbortUploadDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export const ConfirmAbortUploadDialog = memo((props: ConfirmAbortUploadDialogProps) => {
    const { isOpen, onClose, onConfirm } = props;
    const { t } = useTranslation({ ConfirmAbortUploadDialog });

    return (
        <Dialog
            title={t("dialog title")}
            body={t("dialog body")}
            buttons={
                <>
                    <Button onClick={onClose} autoFocus variant="secondary">
                        {t("continue upload")}
                    </Button>
                    <Button autoFocus onClick={onConfirm}>
                        {t("cancel upload")}
                    </Button>
                </>
            }
            isOpen={isOpen}
            onClose={onClose}
        />
    );
});

ConfirmAbortUploadDialog.displayName = symToStr({
    ConfirmAbortUploadDialog
});

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "continue upload" | "cancel upload"
>()({ ConfirmAbortUploadDialog });
export type I18n = typeof i18n;
