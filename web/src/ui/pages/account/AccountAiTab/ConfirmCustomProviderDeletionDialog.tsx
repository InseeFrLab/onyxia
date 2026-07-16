import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";

export type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export const ConfirmCustomProviderDeletionDialog = memo((props: Props) => {
    const { isOpen, onClose, onConfirm } = props;

    const { t } = useTranslation({ ConfirmCustomProviderDeletionDialog });
    const { classes } = useStyles();
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            maxWidth={false}
            className={classes.paper}
            title={t("dialog title")}
            body={t("dialog body")}
            buttons={
                <>
                    <Button variant="secondary" autoFocus={true} onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        startIcon={getIconUrlByName("Delete")}
                        variant="primary"
                        onClick={onConfirm}
                    >
                        {t("delete provider")}
                    </Button>
                </>
            }
        />
    );
});

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "cancel" | "delete provider"
>()({ ConfirmCustomProviderDeletionDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ConfirmCustomProviderDeletionDialog }).create(() => ({
    paper: {
        width: 650,
        maxWidth: "calc(100vw - 48px)",
        borderRadius: 12
    }
}));
