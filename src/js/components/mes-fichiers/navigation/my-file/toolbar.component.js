import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Paper, Fab, Icon } from "@material-ui/core";

const Toolbar = ({ parentPath, download, deleteFile }) => (
  <Paper className="onyxia-toolbar" elevation={1}>
    <Fab
      className="bouton"
      color="secondary"
      title="télécharger"
      onClick={download}
    >
      <Icon fontSize="small">cloud_download</Icon>
    </Fab>
    <Link to={parentPath}>
      <Fab
        className="bouton"
        color="secondary"
        title="supprimer"
        onClick={deleteFile}
      >
        <Icon fontSize="small">delete</Icon>
      </Fab>
    </Link>
  </Paper>
);

Toolbar.propTypes = {
  parentPath: PropTypes.string.isRequired,
  download: PropTypes.func.isRequired,
  deleteFile: PropTypes.func.isRequired
};

export default Toolbar;
