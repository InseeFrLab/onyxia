import { connect } from 'react-redux';
import { updateUser, logout, getUserInfo } from 'js/redux/actions';
import MonCompte from './mon-compte.component';

const mapDispatchToProps = ({ user }) => ({ user });

export default connect(mapDispatchToProps, { updateUser, logout, getUserInfo })(
	MonCompte
);
