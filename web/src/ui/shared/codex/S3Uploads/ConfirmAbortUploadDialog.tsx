import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";

export type ConfirmAbortUploadDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export const ConfirmAbortUploadDialog = memo((props: ConfirmAbortUploadDialogProps) => {
    const { isOpen, onClose, onConfirm } = props;

    return (
        <Dialog
            title="Cancel Upload?"
            body="Your upload is not complete. Would you like to cancel the upload?"
            buttons={
                <>
                    <Button onClick={onClose} autoFocus variant="secondary">
                        Continue Upload
                    </Button>
                    <Button autoFocus onClick={onConfirm}>
                        Cancel Upload
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
