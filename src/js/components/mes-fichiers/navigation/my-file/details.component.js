import React from "react";
import PropTypes from "prop-types";
import Moment from "moment";
import { Typography, Paper } from "@material-ui/core";

const Details = ({ file, statusPolicy }) => (
  <Paper className="paragraphe" elevation={1}>
    <Typography variant="h3" gutterBottom>
      Caractéristiques
    </Typography>
    <Typography variant="body1" gutterBottom>
      nom : {file.name}
    </Typography>
    <Typography variant="body1" gutterBottom>
      taille : {getSizeLabel(file.size)}
    </Typography>
    <Typography variant="body1" gutterBottom>
      date de dernière modification : {formatageDate(file.lastModified)}
    </Typography>
    {statusPolicy ? (
      <Typography variant="body1" gutterBottom>
        Votre fichier est dans un répertoire public. Il est donc accéssible pour
        tous.
      </Typography>
    ) : null}
  </Paper>
);

const getSizeLabel = size =>
  size > 1000000000
    ? `${(size / Math.pow(1024, 2)).toFixed(3)} go`
    : size > 1000000
    ? `${Math.round(size / Math.pow(1024, 2)).toFixed(2)} mo`
    : `${Math.round(size / 1024).toFixed(2)} ko`;

/* */
const formatageDate = date => new Moment(date).format("DD/MM/YYYY");

Details.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    lastModified: PropTypes.instanceOf(Date).isRequired
  }).isRequired
};

export default Details;
