import React from 'react';
import Typography from '@material-ui/core/Typography';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { useSelector } from "js/redux/store";
import { Paper } from '@material-ui/core';
import CopyableField from '../commons/copyable-field';
import { getKeycloak } from 'js/utils';
import ExportCredentialsField from '../mon-compte/export-credentials-component';
import D from 'js/i18n';
import exportKub from './exportCredentialsKub';

const EnTete = () => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			{D.cluster}
		</Typography>
	</div>
);

const Cluster = () => {

	const user= useSelector(state => state.user);

	return (
		<>
			<EnTete />
			<FilDAriane fil={fil.cluster} />
			<div className="contenu accueil">
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
			</div>
		</>
	);
};

export default Cluster;
