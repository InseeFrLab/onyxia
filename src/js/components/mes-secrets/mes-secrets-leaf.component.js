import React from "react";
// import PropTypes from 'prop-types';
// import { Link } from 'react-router-dom';
import { Typography, Paper } from "@material-ui/core";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";

import SecretsForm from "./mes-secrets-form.component";

export default ({ location, vaultSecret, updateVaultSecret }) => (
  <React.Fragment>
    <div className="en-tete">
      <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
        Mon secret
      </Typography>
    </div>
    <FilDAriane fil={fil.mesSecrets(location)} />

    <div className="contenu mon-secrets">
      <Paper className="paragraphe" elevation={1}>
        <Typography variant="h3" align="left" color="textPrimary" gutterBottom>
          Votre secret.
        </Typography>
        {vaultSecret ? (
          <SecretsForm
            secretData={vaultSecret}
            onUpdate={updateVaultSecret}
            location={location.replace("/mes-secrets", "")}
          ></SecretsForm>
        ) : (
          <div>Secrets en cours de chargement</div>
        )}
      </Paper>
    </div>
  </React.Fragment>
);
