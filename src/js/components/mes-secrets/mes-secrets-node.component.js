import React from "react";
// import PropTypes from 'prop-types';
import { Link } from "react-router-dom";
import CreatePath from "./create-path.component";
import { Typography } from "@material-ui/core";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";

class SecretsNode extends React.Component {
  handleChangePath() {}
  handleClickCreatePath() {}
  render() {
    const { location, vaultSecretsList } = this.props;

    return (
      <React.Fragment>
        <div className="en-tete">
          <Typography
            variant="h2"
            align="center"
            color="textPrimary"
            gutterBottom
          >
            Vos secrets
          </Typography>
        </div>
        <FilDAriane fil={fil.mesSecrets(location)} />

        <div className="contenu mes-secrets">
          <div className="secrets">
            <CreatePath location={location} />
            <div>
              <ul>
                {vaultSecretsList
                  ? vaultSecretsList.map((path, i) => (
                      <Link
                        to={`${location}${
                          location.endsWith("/") ? "" : "/"
                        }${path}${path.endsWith("/") ? "?path=true" : ""}`}
                        key={i}
                      >
                        <li>{path}</li>
                      </Link>
                    ))
                  : null}
              </ul>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default SecretsNode;
