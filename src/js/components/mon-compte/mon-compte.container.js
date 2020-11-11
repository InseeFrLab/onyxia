import { connect } from 'react-redux';
import { actions } from 'js/redux/legacyActions';
import { MonCompte } from './mon-compte.component';

const { logout, getUserInfo, updateVaultSecret } = actions;

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps, {
	logout,
	getUserInfo,
	updateVaultSecret,
})(MonCompte);
