import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import Typography from '@material-ui/core/Typography';
import { Icon, Fab } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { getMinioToken } from "js/minio-client/minio-client";
import CopyableField from 'js/components/commons/copyable-field';
import Loader from 'js/components/commons/loader';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
import ExportCredentialsField from './export-credentials-component';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import './mon-compte.scss';
import exportMinio from './export-credentials-minio';
import D from 'js/i18n';
import S3Field from './s3';
import GitField from './git';
import { resetVaultPwd } from 'js/vault-client';
import { User } from 'js/model/User';
import useBetaTest from '../hooks/useBetaTest';
import type { actions as secretsActions } from "js/redux/secrets";
import type { HandleThunkActionCreator } from "react-redux";

interface Props {
	user?: User;
	getUserInfo: () => void;
	updateVaultSecret: HandleThunkActionCreator<typeof secretsActions["updateVaultSecret"]>;
	logout: () => void;
}

export const MonCompte = ({ user, getUserInfo, updateVaultSecret, logout }: Props) => {
	const [betaTest, setBetaTest] = useBetaTest();
	const [s3loading, setS3Loading] = useState(false);

	useEffect(() => {
		if (!user) {
			getUserInfo();
		}
	});

	useEffect(() => {
		if (user && !s3loading && (!user.S3 || !user.S3.AWS_EXPIRATION)) {
			setS3Loading(true);
			getMinioToken().then(() => setS3Loading(false));
		}
	}, [user, s3loading]);

	const handleChange = (event: any) => {
		setBetaTest(event.target.checked);
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
					<GitField
						idep={user.IDEP}
						values={user.VAULT && user.VAULT.DATA}
						updateVaultSecret={updateVaultSecret}
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
					<CopyableField copy label={D.oidcToken} value={getKeycloakInstance().token!} />
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
				<Paper className="paragraphe" elevation={1}>
					<FormControlLabel
						control={
							<Switch
								onChange={handleChange}
								name="checkedB"
								color="primary"
								checked={betaTest as any}
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


const formatageDate = (date: any) => dayjs(date).format('DD/MM/YYYY à HH:mm:ss');
