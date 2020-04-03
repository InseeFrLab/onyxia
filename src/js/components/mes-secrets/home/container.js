import { connect } from 'react-redux';
import MesSecrets from './component';

const mapStateToProps = ({ user }) => ({
	idep: user.IDEP,
	data: user.VAULT ? user.VAULT.DATA : undefined,
});

export default connect(mapStateToProps)(MesSecrets);
