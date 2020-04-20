import { connect } from 'react-redux';
import { logout, getUserInfo, updateVaultSecret } from 'js/redux/actions';
import MonCompte from './mon-compte.component';

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps, {
	logout,
	getUserInfo,
	updateVaultSecret,
})(MonCompte);
