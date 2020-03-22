import React from "react";
import PropTypes from "prop-types";
import { typeRequest } from "js/utils";
import MesServices from "./mes-services.container";
import MonGroupe from "js/components/my-lab/mon-groupe";
import MonService from "js/components/my-lab/mon-service";
import { getParamsFromProps } from "js/utils";

class MesServicesAiguillage extends React.Component {
  state = { refresh: false };
  constructor(props) {
    super(props);
    this.state = { params: getParamsFromProps(props) };
    this.props.checkRequestMesServices(this.state.params);
  }

  componentDidUpdate(prevProps) {
    const prevParams = getParamsFromProps(prevProps);
    const params = getParamsFromProps(this.props);
    if (
      Object.entries(prevParams).toString() !==
      Object.entries(params).toString()
    ) {
      this.props.checkRequestMesServices(params);
    }
  }

  componentWillUnmount() {
    this.props.resetMesServiceTypeRequest();
  }

  render() {
    switch (this.props.typeRequest) {
      case typeRequest.global:
        return <MesServices />;
      case typeRequest.group:
        return <MonGroupe />;
      case typeRequest.app:
        return <MonService />;
      default:
        return null;
    }
  }
}

MesServicesAiguillage.propTypes = {
  resetMesServiceTypeRequest: PropTypes.func.isRequired,
  checkRequestMesServices: PropTypes.func.isRequired,
  typeRequest: PropTypes.string
};

export default MesServicesAiguillage;
