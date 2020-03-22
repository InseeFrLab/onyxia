import { connect } from "react-redux";
import {
  setServiceSelectionne,
  loadServiceCollaboratif
} from "js/redux/actions";
import DetailesService from "./details-service";

const mapStateToProps = state => {
  const { serviceSelectionne } = state.public;
  return {
    serviceSelectionne
  };
};
const mapDispatchToProps = {
  setServiceSelectionne,
  loadServiceCollaboratif
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DetailesService);
