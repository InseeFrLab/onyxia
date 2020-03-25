import { connect } from 'react-redux';
import MesFichier from './mes-fichiers.component';
import { loadUserBuckets, getUserInfo } from 'js/redux/actions';

const dispatchStateToProps = (state) => {
	const { user } = state;
	const { userBuckets: buckets } = state.mesFichiers;
	return { user, buckets };
};

export default connect(dispatchStateToProps, { loadUserBuckets, getUserInfo })(
	MesFichier
);
