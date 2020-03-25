import { connect } from 'react-redux';
import Accueil from './accueil.component';
import { chargerAccueil } from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { accueil } = state.app;
	return { accueil };
};

export default connect(mapStateToProps, { chargerAccueil })(Accueil);
