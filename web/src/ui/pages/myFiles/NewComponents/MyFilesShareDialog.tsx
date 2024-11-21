import { declareComponentKeys } from "i18nifty";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { DirectoryOrFileDetailed } from "./DirectoryOrFileDetailed";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";
import { MyFilesShareSelectTime } from "./MyFilesShareSelectTime";

export type Props = { isPublic: boolean; kind: "directory" | "file" };
export const MyFilesShareDialog = memo((props: Props) => {
    const { isPublic, kind } = props;
    const { t } = useTranslation({ MyFilesShareDialog });

    const { classes } = useStyles();
    const [isOpen, setIsOpen] = useState(true);
    const onClose = () => setIsOpen(false);

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            body={
                <div className={classes.dialogContent}>
                    <DirectoryOrFileDetailed
                        name="test"
                        kind={kind}
                        isPublic={isPublic}
                        className={classes.directoryDetails}
                    />
                    <div className={classes.shareContainer}>
                        <MyFilesShareSelectTime />
                        <Text typo="body 1" className={classes.expirationText}>
                            ou
                        </Text>
                        <Button
                            variant="ternary"
                            startIcon={getIconUrlByName(
                                isPublic ? "VisibilityOff" : "Visibility" //Language in figma but do not found the off icon
                            )}
                        >
                            {isPublic
                                ? "Rendre le dossier privé"
                                : "Rendre le dossier public"}
                        </Button>
                    </div>
                </div>
            }
            title={"Partager vos données"}
            subtitle={
                <Text typo="body 1">
                    Créer un lien d’accès pour partager votre répertoire avec un
                    partenaire.
                </Text>
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button autoFocus doOpenNewTabIfHref={false} onClick={onClose}>
                        {t("create and copy link")}
                    </Button>
                </>
            }
        />
    );
});

const useStyles = tss.withName({ MyFilesShareDialog }).create(({ theme }) => ({
    dialogContent: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(6),
        marginBottom: theme.spacing(6)
    },
    directoryDetails: {
        margin: theme.muiTheme.spacing(4, 2, 4, 2)
    },
    shareContainer: {
        display: "flex",
        justifyContent: "space-between"
    },
    expirationText: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1)
    }
}));
const { i18n } = declareComponentKeys<"cancel" | "create and copy link">()({
    MyFilesShareDialog
});
export type I18n = typeof i18n;
