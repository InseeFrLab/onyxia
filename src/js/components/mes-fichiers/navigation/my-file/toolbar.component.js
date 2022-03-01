import PropTypes from "prop-types";
import { Paper, Fab } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";

const Toolbar = ({ linkToParentPathProps, download, deleteFile }) => (
    <Paper className="onyxia-toolbar" elevation={1}>
        <Fab className="bouton" color="secondary" title="télécharger" onClick={download}>
            <CloudDownloadIcon fontSize="small">cloud_download</CloudDownloadIcon>
        </Fab>

        <a {...linkToParentPathProps}>
            <Fab
                className="bouton"
                color="secondary"
                title="supprimer"
                onClick={deleteFile}
            >
                <DeleteIcon fontSize="small">delete</DeleteIcon>
            </Fab>
        </a>
    </Paper>
);

Toolbar.propTypes = {
    linkToParentPathProps: PropTypes.object.isRequired,
    download: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,
};

export default Toolbar;
