import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
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
import { resetVaultPwd } from 'js/vault-client';
import { User } from 'js/model/User';

interface Props {
	user?: User;
	getUserInfo: () => void;
	logout: () => void;
}
interface State {
	value: string;
	handleReset?: () => void;
}

const MonCompte = ({ user, getUserInfo, logout }: Props) => {
	const [betatest, setBetatest] = useState(hasOptedInForBetaTest());

	useEffect(() => {
		if (!user) {
			getUserInfo();
		}
	});

	useEffect(() => {
		if (user && (!user.S3 || !user.S3.AWS_EXPIRATION)) {
			getMinioToken();
		}
	});

	const handleChange = (event) => {
		changeBetaTestStatus(event.target.checked).then(() =>
			setBetatest(hasOptedInForBetaTest())
		);
	};

	if (!user) return null;

	const credentials = user.S3;

	return (
		<>
			<div className="en-tete">
				<Typography
					variant="h2"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					{D.hello} {user.USERNAME}
				</Typography>
			</div>
			<FilDAriane fil={fil.monCompte} />
			<div className="contenu mon-compte">
				<Paper className="onyxia-toolbar" elevation={1}>
					<Fab
						className="bouton-rouge"
						color="primary"
						title="logout"
						onClick={logout}
					>
						<Icon>power_settings_new_icon</Icon>
					</Fab>
				</Paper>

				<Paper className="paragraphe" elevation={1}>
					<Typography variant="h3" align="left">
						{D.onyxiaProfile}
					</Typography>
					<S3Field
						value={
							user.VAULT && user.VAULT.DATA ? user.VAULT.DATA.password : ''
						}
						handleReset={() => resetVaultPwd(user.IDEP)}
					/>
				</Paper>

				<Paper className="paragraphe" elevation={1}>
					{user.IDEP ? (
						<>
							<Typography variant="h3" align="left">
								{D.user}
							</Typography>
							<CopyableField copy label="Idep" value={user.IDEP} />
							<CopyableField copy label="Nom complet" value={user.USERNAME} />
							<CopyableField copy label="Email" value={user.USERMAIL} />
							<CopyableField copy label="IP" value={user.IP} />
						</>
					) : (
						<Loader />
					)}
					<CopyableField copy label={D.oidcToken} value={getKeycloak().token} />
				</Paper>

				{credentials ? (
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							{D.minioLoginInfo}
						</Typography>
						<Typography variant="body1" align="left">
							{D.minioLoginExplanation}
							{formatageDate(credentials.AWS_EXPIRATION)}.
						</Typography>
						<CopyableField
							copy
							label={D.minioAccessKey}
							value={credentials.AWS_ACCESS_KEY_ID || ''}
						/>
						<CopyableField
							copy
							label={D.minioSecretAccessKey}
							value={credentials.AWS_SECRET_ACCESS_KEY || ''}
						/>
						<CopyableField
							copy
							label={D.minioSessionToken}
							value={credentials.AWS_SESSION_TOKEN || ''}
						/>
						<CopyableField
							copy
							label={D.minioEndpoint}
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
				{betatest ? (
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" align="left">
							Kubernetes
						</Typography>
						<Typography variant="body1" align="left">
							{D.k8sLoginExplanation}
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
								onChange={handleChange}
								name="checkedB"
								color="primary"
								checked={betatest}
							/>
						}
						label={D.activateBetatest}
					/>
				</Paper>
			</div>
		</>
	);
};

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

const formatageDate = (date) => dayjs(date).format('DD/MM/YYYY à HH:mm:ss');
