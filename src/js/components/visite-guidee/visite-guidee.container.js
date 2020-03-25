import { connect } from 'react-redux';
import vignettes from './vignettes';
import { setSelectedService, creerNouveauService } from 'js/redux/actions';
import Visite from './visite-guidee.component';

const mapStateToProps = (state) => {
	const { visite } = state.app;
	const { catalogue, mesServices } = state.myLab;

	return {
		visite,
		etapes: vignettes,
		firstService: catalogue.length > 0 ? catalogue[0] : null,
		serviceCree: mesServices.find(
			(s) => s.labels.ONYXIA_TITLE === 'drawio-exemple'
		),
	};
};

const mapToDispatchToProps = (d) => ({
	setFirstService: (firstService) => {
		d(setSelectedService(firstService));
	},
	creerPremier: () => {
		d(
			creerNouveauService(
				{ name: 'Draw.io', currentVersion: 10 },
				{
					onyxia: { friendly_name: 'drawio-exemple' },
					service: { cpus: 0.2, mem: 1024 },
				}
			)
		);
	},
});

export default connect(mapStateToProps, mapToDispatchToProps)(Visite);
