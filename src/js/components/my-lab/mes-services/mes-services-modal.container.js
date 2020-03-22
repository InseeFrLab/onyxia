import { connect } from 'react-redux';
import ServiceModal from './mes-services-modal.component';
import { changerEtatService, requestDeleteMonService } from 'js/redux/actions';

const dispatchStateToProps = (state, props) => {
	return { ...props };
};

export default connect(
	dispatchStateToProps,
	{
		changerEtatService,
		requestDeleteMonService,
	}
)(ServiceModal);
