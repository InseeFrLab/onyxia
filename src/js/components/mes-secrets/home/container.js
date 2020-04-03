import { connect } from 'react-redux';
import MesSecrets from './component';

const mapStateToProps = ({ user }) => ({ idep: user.IDEP });

export default connect(mapStateToProps)(MesSecrets);
