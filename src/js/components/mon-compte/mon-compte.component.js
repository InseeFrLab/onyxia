import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import Typography from '@material-ui/core/Typography';
import { Icon, Fab } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { getMinioToken } from 'js/minio-client';
import CopyableField from 'js/components/commons/copyable-field';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { getKeycloak } from 'js/utils';
import './mon-compte.scss';

class MonCompte extends React.Component {
	state = { credentials: null };
	constructor(props) {
		super(props);
		if (!props.user) {
			props.getUserInfo();
		}
	}

	componentDidMount() {
		getMinioToken();
	}

	handleLogout = () => this.props.logout();

	refreshKey = () => this.props.updateUser();

	render() {
		const { user } = this.props;
		const credentials = user.S3;
		if (!user) return null;
		return (
			<React.Fragment>
				<div className="en-tete">
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						Bonjour {user.nomComplet}
					</Typography>
				</div>
				<FilDAriane fil={fil.monCompte} />
				<div className="contenu mon-compte">
					<Paper className="onyxia-toolbar" elevation={1}>
						<Fab
							className="bouton-rouge"
							color="primary"
							title="logout"
							onClick={this.handleLogout}
						>
							<Icon>power_settings_new_icon</Icon>
						</Fab>
						<Fab
							title="renouveler la clef ssh"
							className="bouton"
							color="primary"
							onClick={this.refreshKey}
						>
							<Icon>vpn_key</Icon>
						</Fab>
					</Paper>

					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							Utilisateur
						</Typography>
						<CopyableField copy label="idep" value={user.IDEP} />
						<CopyableField copy label="nom complet" value={user.USERNAME} />
						<CopyableField copy label="email" value={user.USERMAIL} />
						<CopyableField copy label="ip" value={user.IP} />
					</Paper>

					{credentials ? (
						<Paper className="paragraphe" elevation={1}>
							<Typography variant="h3" align="left">
								Identifiants Minio
							</Typography>
							<Typography variant="body1" align="left">
								Vos identifiants seront valable jusqu&rsquo;au&nbsp;
								{formatageDate(credentials.AWS_EXPIRATION)}
							</Typography>
							<CopyableField
								copy
								label="Access Key"
								value={credentials.AWS_ACCESS_KEY_ID || ''}
							/>
							<CopyableField
								copy
								label="Secret Access Key"
								value={credentials.AWS_SECRET_ACCESS_KEY || ''}
							/>
							<CopyableField
								copy
								label="Session Token"
								value={credentials.AWS_SESSION_TOKEN || ''}
							/>
						</Paper>
					) : null}

					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							Clef ssh
						</Typography>
						{isEmptySsh(user.SSH.SSH_PUBLIC_KEY) ? (
							<NoShhKey />
						) : (
							<SshKeyUser ssh={user.SSH.SSH_PUBLIC_KEY} />
						)}
					</Paper>
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							Jeton
						</Typography>
						<CopyableField
							copy
							label="votre jeton oidc"
							value={getKeycloak().token}
						/>
					</Paper>
				</div>
			</React.Fragment>
		);
	}
}

const isEmptySsh = (sshPublicKey) => !sshPublicKey || sshPublicKey === '';

const NoShhKey = () => (
	<React.Fragment>
		<p>Attention&#33; Vous ne possédez pas de clefs SSH. </p>
		<p>
			Par conséquent, vous ne pouvez pas utiliser les fonctionnalités GIT avec
			les conteneurs sur Onyxia.
		</p>
	</React.Fragment>
);

const SshKeyUser = ({ ssh }) => (
	<CopyableField copy label="votre clef publique" value={ssh} />
);

MonCompte.propTypes = {
	user: PropTypes.shape({
		idep: PropTypes.string.isRequired,
		nomComplet: PropTypes.string.isRequired,
		email: PropTypes.string.isRequired,
		ip: PropTypes.string.isRequired,
	}),
};

export default MonCompte;

const formatageDate = (date) =>
	new Moment(date).format('DD/MM/YYYY à HH:mm:ss');
