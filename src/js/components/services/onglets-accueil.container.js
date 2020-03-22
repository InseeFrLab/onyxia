import { connect } from 'react-redux';
import OngletsAccueil from './onglets-accueil';
import { chargerServices, setServiceSelectionne } from 'js/redux/actions';

const mapStateToProps = state => {
	const { alpaServices, betaServices, stableServices } = state.public;
	return {
		alpaServices,
		betaServices,
		stableServices,
	};
};
const mapDispatchToProps = {
	chargerServices,
	setServiceSelectionne,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(OngletsAccueil);
