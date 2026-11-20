import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    /** undefined: closed */
    providerName: string | undefined;
    onClose: (params: { doProceed: boolean }) => void;
};

export function ConfirmGitProviderRemovalDialog(props: Props) {
    const { providerName, onClose } = props;

    const { t } = useTranslation({ ConfirmGitProviderRemovalDialog });
    const { classes } = useStyles();

    return (
        <Dialog
            isOpen={providerName !== undefined}
            onClose={() => onClose({ doProceed: false })}
            maxWidth="sm"
            fullWidth={true}
            className={classes.paper}
            title={t("dialog title", { providerName: providerName ?? "" })}
            body={t("dialog body", { providerName: providerName ?? "" })}
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
                        {t("remove provider")}
                    </Button>
                </>
            }
        />
    );
}

const { i18n } = declareComponentKeys<
    | { K: "dialog title"; P: { providerName: string } }
    | { K: "dialog body"; P: { providerName: string } }
    | "cancel"
    | "remove provider"
>()({ ConfirmGitProviderRemovalDialog });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ ConfirmGitProviderRemovalDialog })
    .create(({ theme }) => ({
        paper: {
            borderRadius: theme.spacing(2.5)
        }
    }));
