import { connect } from 'react-redux';
import MesServicesGeneriques from './mes-services-generiques.component';
import {
	checkRequestMesServices,
	resetMesServiceTypeRequest,
} from 'js/redux/actions';

const mapStateToProps = state => {
	return {
		typeRequest: state.myLab.mesServicesTypeRequest,
	};
};

export default connect(
	mapStateToProps,
	{ checkRequestMesServices, resetMesServiceTypeRequest }
)(MesServicesGeneriques);
