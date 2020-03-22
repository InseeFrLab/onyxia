import React from "react";
import { Paper, Icon, Fab } from "@material-ui/core";
import PropTypes from "prop-types";

const Toolbar = ({
  isInPublicDirectory,
  isPublicDirectory,
  deleteFiles,
  lockDirectory,
  unlockDirectory
}) => (
  <Paper className="onyxia-toolbar" elevation={1}>
    <Fab
      className="bouton"
      color="secondary"
      title="supprimer les fichiers sélectionnés"
      onClick={deleteFiles}
    >
      <Icon fontSize="small">delete</Icon>
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
        onClick={() =>
          isPublicDirectory ? lockDirectory() : unlockDirectory()
        }
      >
        <Icon fontSize="small">{isPublicDirectory ? "lock" : "lock_open"}</Icon>
      </Fab>
    )}
  </Paper>
);
Toolbar.propTypes = {
  deleteFiles: PropTypes.func.isRequired,
  isInPublicDirectory: PropTypes.bool.isRequired,
  isPublicDirectory: PropTypes.bool.isRequired,
  lockDirectory: PropTypes.func.isRequired,
  unlockDirectory: PropTypes.func.isRequired
};

export default Toolbar;
