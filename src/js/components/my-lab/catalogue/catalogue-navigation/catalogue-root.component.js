import React, { useState, useEffect } from "react";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import Catalogue from "./catalogue.component";
import { axiosAuth } from "js/utils";
import api from "js/redux/api";
import "./catalogue.scss";

const Root = ({ startWaiting, stopWaiting }) => {
  const [catalogues, setCatalogues] = useState([]);
  const [init, setInit] = useState(false);
  useEffect(() => {
    if (!init) {
      const chargerCatalogues = async () => {
        const { universes } = await axiosAuth(api.catalogue);
        setCatalogues(universes ? universes : []);
      };
      setInit(true);
      chargerCatalogues();
    }
  }, [init]);
  return (
    <React.Fragment>
      <div className="en-tete">
        <Typography
          variant="h2"
          align="center"
          color="textPrimary"
          gutterBottom
        >
          La liste des catalogues disponibles.
        </Typography>
      </div>
      <FilDAriane fil={fil.catalogues} />

      <div className="contenu catalogue">
        <Grid container spacing={2}>
          {catalogues
            .filter(catalogue => catalogue.status === "PROD")
            .map(catalogue => (
              <Catalogue catalogue={catalogue} key={catalogue.id} />
            ))}
        </Grid>
      </div>
    </React.Fragment>
  );
};

export default Root;
