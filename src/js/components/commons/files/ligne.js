import React from "react";
import { Button, Icon } from "@material-ui/core";
import { Link } from "react-router-dom";
import Checkbox from "@material-ui/core/Checkbox";

const Ligne = ({
  path,
  name,
  icone,
  color = "secondary",
  handleCheck,
  checked,
  onClick
}) => (
  <React.Fragment>
    <div className="entry">
      <Link to={path}>
        <Button className="directory" onClick={onClick}>
          <Icon className="icone" color={color}>
            {icone}
          </Icon>
          <span className="texte">{name}</span>
        </Button>

        {checked !== undefined && handleCheck ? (
          <Checkbox
            checked={checked}
            onChange={handleCheck}
            className="select-it"
          />
        ) : null}
      </Link>
    </div>
  </React.Fragment>
);

export default Ligne;
