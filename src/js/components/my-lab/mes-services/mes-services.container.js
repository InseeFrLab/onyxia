import { connect } from 'react-redux';
import MesServices from './mes-services.component';

import {
	chargerMesServices,
	changerEtatService,
	requestDeleteMonService,
	cardStartWaiting,
	stopAllWaitingCards,
} from 'js/redux/actions';

const mapStateToProps = (state) => {
	const {
		mesServices: services,
		mesServicesWaiting,
		mesGroupes: groupes,
	} = state.myLab;
	return {
		services,
		groupes,
		mesServicesWaiting,
	};
};
const mapDispatchToProps = {
	initialiser: chargerMesServices,
	refresh: chargerMesServices,
	changerEtatService,
	requestDeleteMonService,
	cardStartWaiting,
	stopAllWaitingCards,
};

export default connect(mapStateToProps, mapDispatchToProps)(MesServices);
