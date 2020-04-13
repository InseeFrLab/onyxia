import { connect } from 'react-redux';
import MonGroupe from './mon-groupe.component';
import { withRouter } from 'react-router-dom';
import {
	chargerMonGroupe,
	suivreStatutService,
	changerEtatService,
	requestDeleteMonService,
	cardStartWaiting,
	supprimerGroupe,
} from 'js/redux/actions';

const mapStateToProps = (state) => {
	const {
		mesServicesTypeRequest: typeRequest,
		mesServices: services,
		mesServicesWaiting,
		mesGroupes: groupes,
		groupe,
	} = state.myLab;
	return {
		typeRequest,
		services,
		groupes,
		mesServicesWaiting,
		groupe,
	};
};

const mapDispatchToProps = (dispatch, props) => ({
	initialiser: () => {},
	refresh: () => {
		dispatch(chargerMonGroupe(Object.values(props.match.params)[0]));
	},
	suivreStatutService: (id) => {
		dispatch(suivreStatutService(id));
	},
	changerEtatService: (serviceId, etat, mems, cpus) => {
		dispatch(changerEtatService(serviceId, etat, mems, cpus));
	},
	requestDeleteMonService: (id) => {
		dispatch(requestDeleteMonService(id));
	},
	cardStartWaiting: (id) => {
		dispatch(cardStartWaiting(id));
	},
	supprimerGroupe: (id) => {
		dispatch(supprimerGroupe(id));
	},
});

export default withRouter(
	connect(mapStateToProps, mapDispatchToProps)(MonGroupe)
);
