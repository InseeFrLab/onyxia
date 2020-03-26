import { connect } from 'react-redux';
import OngletContent from './onglet-content';
import { chargerServices, setServiceSelectionne } from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { alphaServices, betaServices, stableServices } = state.public;
	return {
		alphaServices,
		betaServices,
		stableServices,
	};
};
const mapDispatchToProps = {
	chargerServices,
	setServiceSelectionne,
};

export default connect(mapStateToProps, mapDispatchToProps)(OngletContent);
