import { connect } from 'react-redux';
import AsyncOngletContent from './onglet-content-async';
import { setServiceSelectionne } from 'js/redux/actions';

const mapDispatchToProps = {
	setServiceSelectionne,
};

export default connect(undefined, mapDispatchToProps)(AsyncOngletContent);
