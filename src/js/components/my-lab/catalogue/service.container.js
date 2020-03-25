import { connect } from 'react-redux';
import Service from './service.component';
import { chargerService } from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { serviceSelected: service } = state.myLab;
	return { service };
};

export default connect(mapStateToProps, { chargerService })(Service);
