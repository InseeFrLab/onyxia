import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import Typography from '@material-ui/core/Typography';
import { Icon, Fab } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { getMinioToken } from 'js/minio-client';
import CopyableField from 'js/components/commons/copyable-field';
import Loader from 'js/components/commons/loader';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { getKeycloak } from 'js/utils';
import ExportCredentialsField from './export-credentials-component';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import './mon-compte.scss';
import {
	hasOptedInForBetaTest,
	changeBetaTestStatus,
} from '../../configuration/betatest';
import exportMinio from './export-credentials-minio';
import exportKub from './export-credentials-kub';
import D from 'js/i18n';
import S3Field from './s3';
import { resetVaultPwd, getVersionsList } from 'js/vault-client';

class MonCompte extends React.Component {
	state = {
		credentials: null,
		betatest: hasOptedInForBetaTest(),
		versionsList: null,
	};
	constructor(props) {
		super(props);
		if (!props.user) {
			props.getUserInfo()
		}
	}

	componentDidMount() {
		getMinioToken();
	}

	handleLogout = () => this.props.logout();

	refreshKey = () => this.props.updateUser();

	handleChange = (event) => {
		changeBetaTestStatus(event.target.checked).then(() =>
			this.setState({ betatest: hasOptedInForBetaTest() })
		);
	};

	render() {
		const { user } = this.props;
		const credentials = user.S3;
		if (!user) return null;
		return (
			<>
				<div className="en-tete">
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						Bonjour {user.USERNAME}
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
					</Paper>

					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							Profil onyxia
						</Typography>
						<S3Field
							value={
								user.VAULT && user.VAULT.DATA ? user.VAULT.DATA.password : ''
							}
							versionsList={this.state.versionsList}
							handleReset={() => resetVaultPwd(user.IDEP)}
						/>
					</Paper>

					<Paper className="paragraphe" elevation={1}>
						{user.IDEP ? (
							<>
								<Typography variant="h3" align="left">
									Utilisateur
								</Typography>
								<CopyableField copy label="Idep" value={user.IDEP} />
								<CopyableField copy label="Nom complet" value={user.USERNAME} />
								<CopyableField copy label="Email" value={user.USERMAIL} />
								<CopyableField copy label="IP" value={user.IP} />
							</>
						) : (
							<Loader />
						)}
						<CopyableField
							copy
							label="Jeton OIDC"
							value={getKeycloak().token}
						/>
					</Paper>

					{credentials ? (
						<Paper className="paragraphe" elevation={1}>
							<Typography variant="h3" align="left">
								Identifiants Minio (S3)
							</Typography>
							<Typography variant="body1" align="left">
								Ces identifiants vous permettent d'accéder à vos fichiers. Ils
								sont valables jusqu&rsquo;au&nbsp;
								{formatageDate(credentials.AWS_EXPIRATION)}.
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
							<CopyableField
								copy
								label="S3 endpoint"
								value={credentials.AWS_S3_ENDPOINT || ''}
							/>
							<ExportCredentialsField
								credentials={credentials}
								exportTypes={exportMinio}
								text={D.exportMinio}
							/>
						</Paper>
					) : (
						<Loader />
					)}
					{this.state.betatest ? (
						<Paper className="paragraphe" elevation={1}>
							<Typography variant="h3" align="left">
								Kubernetes
							</Typography>
							<Typography variant="body1" align="left">
								Ces identifiants vous permettent d'accéder au cluster
								kubernetes.
							</Typography>
							<CopyableField
								copy
								label="Cluster Name"
								value={user.KUBERNETES.KUB_SERVER_NAME}
							/>
							<CopyableField
								copy
								label="Api-server url"
								value={user.KUBERNETES.KUB_SERVER_URL}
							/>
							<CopyableField copy label="Token" value={getKeycloak().token} />
							<ExportCredentialsField
								credentials={user}
								exportTypes={exportKub}
								text={D.exportKub}
							/>
						</Paper>
					) : (
						<></>
					)}

					<Paper className="paragraphe" elevation={1}>
						<FormControlLabel
							control={
								<Switch
									onChange={this.handleChange}
									name="checkedB"
									color="primary"
									checked={this.state.betatest}
								/>
							}
							label="Activer le mode avancé (béta-testeur)"
						/>
					</Paper>
				</div>
			</>
		);
	}
}

MonCompte.propTypes = {
	user: PropTypes.shape({
		idep: PropTypes.string,
		nomComplet: PropTypes.string,
		email: PropTypes.string,
		ip: PropTypes.string,
	}),
};

MonCompte.defaultProps = {
	user: { idep: '', nomComplet: '', email: '', ip: '' },
};

export default MonCompte;

const formatageDate = (date) =>
	new Moment(date).format('DD/MM/YYYY à HH:mm:ss');
