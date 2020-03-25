import { connect } from 'react-redux';
import NouveauService from './nouveau-service';
import { creerNouveauService, chargerService } from 'js/redux/actions';

const mapStateToProps = (state, props) => {
	const { screenWidth } = state.app;
	const { user } = state;
	const { serviceCree, serviceCreationEchec } = state.myLab;
	return {
		...props,

		user,
		serviceCree,
		serviceCreationEchec,
		screenWidth,
	};
};

export default connect(mapStateToProps, {
	creerNouveauService,
	chargerService,
})(NouveauService);
