import { connect } from 'react-redux';
import MonService from './mon-service.component';
import { withRouter } from 'react-router-dom';
import {
	changerEtatService,
	suivreStatutService,
	requestDeleteMonService,
	updateServiceProprietesConfEnv,
	setFavicon,
	refreshMinioToken,
} from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { mesServices, mesServicesWaiting } = state.myLab;
	return {
		wait: isService(mesServices)
			? mesServicesWaiting.indexOf(mesServices[0].id) !== -1
			: false,
		service: isService(mesServices) ? mesServices[0] : null,
	};
};

const isService = (mesServices) => mesServices && mesServices.length > 0;

export default withRouter(
	connect(mapStateToProps, {
		suivreStatutService,
		changerEtatService,
		requestDeleteMonService,
		updateServiceProprietesConfEnv,
		setFavicon,
		refreshMinioToken,
	})(MonService)
);
