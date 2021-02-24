  
import { Typography, Paper, Button } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import CopyableField from 'js/components/commons/copyable-field';

const Public = ({ isPublicFile, isInPublicDirectory }) => (
	<>
		<Typography variant="body1" gutterBottom>
			Votre Fichier est public :
		</Typography>
		{isPublicFile ? (
			<Typography variant="body2" gutterBottom>
				Il est marqué comme public.
			</Typography>
		) : null}
		{isInPublicDirectory ? (
			<Typography variant="body2" gutterBottom>
				Un de ses répertoires parents est marqué comme public.
			</Typography>
		) : null}
	</>
);

const Private = () => (
	<Typography variant="body1" gutterBottom>
		Votre Fichier est privé. Seul vous pouvez le télécharger depuis cet
		emplacement ou par un lien pré-signé temporaire généré ci-dessous.
	</Typography>
);

const Lien = ({ isPublic, url, expiration }) => (
	<>
		<Typography variant="body1" gutterBottom>
			Votre lien de téléchargement :
		</Typography>
		{url ? (
			<div className="lien-telechargement">
				<CopyableField copy label="lien de téléchargement" value={url} />

				<Typography variant="caption" gutterBottom>
					{isPublic
						? '* Attention ce lien est public.'
						: `* Attention ce lien est public. Il expirera le ${expiration}.`}
				</Typography>
			</div>
		) : (
			<CircularProgress />
		)}
	</>
);

const Toggle = ({ isInPublicDirectory, isPublicFile, toggleStatus }) => {
	return isInPublicDirectory ? null : (
		<>
			<Typography variant="body1" gutterBottom style={{ position: 'relative' }}>
				Vous pouvez changer le statut de votre fichier :
				<Button
					style={{ position: 'absolute', right: '0', top: '0' }}
					variant={isPublicFile ? 'outlined' : 'outlined'}
					size="small"
					color={isPublicFile ? 'secondary' : 'primary'}
					onClick={toggleStatus}
					title="changer le statut de l'objet"
				>
					{isPublicFile ? 'private' : 'public'}
				</Button>
			</Typography>
		</>
	);
};

const Status = ({
	isPublicFile,
	isInPublicDirectory,
	fileUrl,
	expiration,
	toggleStatus,
}) => (
	<Paper className="paragraphe" elevation={1}>
		<Typography variant="h3" gutterBottom>
			Statut de diffusion
		</Typography>
		{isPublicFile || isInPublicDirectory ? (
			<Public
				isPublicFile={isPublicFile}
				isInPublicDirectory={isInPublicDirectory}
			/>
		) : (
			<Private />
		)}
		<Lien
			url={fileUrl}
			isPublic={isPublicFile || isInPublicDirectory}
			expiration={expiration}
		/>
		<Toggle
			isPublicFile={isPublicFile}
			isInPublicDirectory={isInPublicDirectory}
			toggleStatus={toggleStatus}
		/>
	</Paper>
);

export default Status;
