import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    /** undefined: closed */
    forgeName: string | undefined;
    onClose: (params: { doProceed: boolean }) => void;
};

export function ConfirmGitForgeRemovalDialog(props: Props) {
    const { forgeName, onClose } = props;

    const { t } = useTranslation({ ConfirmGitForgeRemovalDialog });
    const { classes } = useStyles();

    return (
        <Dialog
            isOpen={forgeName !== undefined}
            onClose={() => onClose({ doProceed: false })}
            maxWidth="sm"
            fullWidth={true}
            className={classes.paper}
            title={t("dialog title", { forgeName: forgeName ?? "" })}
            body={t("dialog body", { forgeName: forgeName ?? "" })}
            buttons={
                <>
                    <Button
                        variant="secondary"
                        autoFocus={true}
                        onClick={() => onClose({ doProceed: false })}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        startIcon={getIconUrlByName("Delete")}
                        variant="primary"
                        onClick={() => onClose({ doProceed: true })}
                    >
                        {t("remove forge")}
                    </Button>
                </>
            }
        />
    );
}

const { i18n } = declareComponentKeys<
    | { K: "dialog title"; P: { forgeName: string } }
    | { K: "dialog body"; P: { forgeName: string } }
    | "cancel"
    | "remove forge"
>()({ ConfirmGitForgeRemovalDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ConfirmGitForgeRemovalDialog }).create(({ theme }) => ({
    paper: {
        borderRadius: theme.spacing(2.5)
    }
}));
