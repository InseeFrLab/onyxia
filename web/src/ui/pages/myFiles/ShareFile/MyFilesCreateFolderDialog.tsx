import { declareComponentKeys } from "i18nifty";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { memo, useState } from "react";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { TextField } from "onyxia-ui/TextField";
import { FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import { Checkbox } from "onyxia-ui/Checkbox";

export const MyFilesCreateFolderDialog = memo(() => {
    const { classes } = useStyles();
    const [isOpen, setIsOpen] = useState(true);
    const onClose = () => setIsOpen(false);

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            body={
                <div className={classes.dialogContent}>
                    <TextField
                        label="Nom du répertoire"
                        defaultValue="Nouveau dossier 1"
                        selectAllTextOnFocus
                    />
                </div>
            }
            title={"Créer un nouveau répertoire"}
            subtitle={
                <Text typo="body 1">
                    Stockez et hiérarchisez vos données avec des répertoires.
                </Text>
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button autoFocus doOpenNewTabIfHref={false} onClick={onClose}>
                        Créer le répertoire et copier le lien
                    </Button>
                    <FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    color="primary"
                                    checked={true}
                                    onChange={() => {}}
                                />
                            }
                            label={"Créer un lien d’importation"}
                        />
                        <FormHelperText>
                            Donner la possibilité à un partenaire d’importer des données
                            dans ce répertoire
                        </FormHelperText>
                    </FormControl>
                </>
            }
        />
    );
});

const useStyles = tss.withName({ MyFilesCreateFolderDialog }).create(({ theme }) => ({
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
    switchContainer: {
        display: "flex",
        alignItems: "center"
    },
    shareInput: {
        width: "100%"
    },
    expirationText: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1)
    }
}));
const { i18n } = declareComponentKeys<"cancel" | "create folder and copy link">()({
    MyFilesCreateFolderDialog
});
export type I18n = typeof i18n;
