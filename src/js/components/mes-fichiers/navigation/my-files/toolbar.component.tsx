import { Paper, Fab } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";

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
                <DeleteIcon fontSize="small">delete</DeleteIcon>
            </Fab>
        ) : null}
        <Fab
            className="bouton"
            color="secondary"
            title="Créer un lien d'upload partenaire"
            onClick={createUploadLink}
        >
            <PeopleIcon fontSize="small">people</PeopleIcon>
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
                {isPublicDirectory ? (
                    <LockIcon fontSize="small">lock</LockIcon>
                ) : (
                    <LockOpenIcon fontSize="small">lock_open</LockOpenIcon>
                )}
            </Fab>
        )}
    </Paper>
);

export default Toolbar;
