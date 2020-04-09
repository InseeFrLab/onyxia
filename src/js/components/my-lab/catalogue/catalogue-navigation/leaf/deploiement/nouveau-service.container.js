import { connect } from 'react-redux';
import NouveauService from './nouveau-service';
import { creerNouveauService } from 'js/redux/actions';

const mapStateToProps = (state, props) => {
	const { screenWidth, authenticated } = state.app;
	const { user } = state;
	const { serviceCree, serviceCreationEchec } = state.myLab;
	return {
		...props,
		authenticated,
		user,
		serviceCree,
		serviceCreationEchec,
		screenWidth,
	};
};

export default connect(mapStateToProps, {
	creerNouveauService,
})(NouveauService);
