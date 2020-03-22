import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

const Titre = ({ titre, wait }) => (
  <>
    <span>{titre}</span>
    {wait ? (
      <span>
        <CircularProgress style={{ float: "right" }} />
      </span>
    ) : null}
  </>
);

export default Titre;
