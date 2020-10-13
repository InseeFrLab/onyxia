import { connect } from 'react-redux';
import vignettes from './vignettes';
import { actions } from 'js/redux/store';
import Visite from './visite-guidee.component';

const { setServiceSelected, creerNouveauService } = actions;

const mapStateToProps = (state) => {
	const { visite } = state.app;
	const { mesServices } = state.myLab;

	return {
		visite,
		etapes: vignettes,
		firstService: null,
		serviceCree: mesServices.find(
			(s) => s.labels.ONYXIA_TITLE === 'rstudio-example'
		),
	};
};

const mapToDispatchToProps = dispatch => ({
	"setFirstService": firstService => {
		dispatch(setServiceSelected(firstService));
	},
	"creerPremier": () => {
		dispatch(
			creerNouveauService(
				{
					name: 'rstudio',
					catalogId: 'inseefrlab-datascience',
					currentVersion: 10,
				},
				{
					onyxia: { friendly_name: 'rstudio-example' },
					service: { cpus: 0.2, mem: 1024 },
				}
			)
		);
	},
});

export default connect(mapStateToProps, mapToDispatchToProps)(Visite);
