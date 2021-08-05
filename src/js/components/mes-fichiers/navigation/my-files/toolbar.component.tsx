import { Paper, Icon, Fab } from "@material-ui/core";

const Toolbar = ({
    isInPublicDirectory,
    isPublicDirectory,
    deleteFiles,
    lockDirectory,
    unlockDirectory,
    createUploadLink,
}: any) => (
    <Paper className="onyxia-toolbar" elevation={1}>
        {deleteFiles ? (
            <Fab
                className="bouton"
                color="secondary"
                title="supprimer les fichiers sélectionnés"
                onClick={deleteFiles}
            >
                <Icon fontSize="small">delete</Icon>
            </Fab>
        ) : null}
        <Fab
            className="bouton"
            color="secondary"
            title="Créer un lien d'upload partenaire"
            onClick={createUploadLink}
        >
            <Icon fontSize="small">people</Icon>
        </Fab>
        {isInPublicDirectory ? null : (
            <Fab
                className="bouton"
                title={
                    isPublicDirectory
                        ? "rendre le répertoire privé"
                        : "rendre le répertoire public"
                }
                color={isPublicDirectory ? "secondary" : "primary"}
                onClick={() => (isPublicDirectory ? lockDirectory() : unlockDirectory())}
            >
                <Icon fontSize="small">{isPublicDirectory ? "lock" : "lock_open"}</Icon>
            </Fab>
        )}
    </Paper>
);

export default Toolbar;
