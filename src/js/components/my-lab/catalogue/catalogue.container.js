import { connect } from 'react-redux';
import Catalogue from './catalogue-navigation';
import { startWaiting, stopWaiting } from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { catalogue, serviceCree } = state.myLab;
	return { catalogue, serviceCree };
};
const mapDispatchToProps = {
	startWaiting,
	stopWaiting,
};

export default connect(mapStateToProps, mapDispatchToProps)(Catalogue);
