import React from 'react';
import Typography from '@material-ui/core/Typography';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { useSelector } from "js/redux/legacyActions";
import { Paper } from '@material-ui/core';
import CopyableField from '../commons/copyable-field';
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
import ExportCredentialsField from '../mon-compte/export-credentials-component';
import D from 'js/i18n';
import exportKub from './exportCredentialsKub';
import { getEnv } from "js/env";

const env = getEnv();

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
					{ env.KUBERNETES !== undefined && 
						<>
							<CopyableField
								copy
								label="Cluster Name"
								value={env.KUBERNETES.KUB_SERVER_NAME}
							/>
							<CopyableField
								copy
								label="Api-server url"
								value={env.KUBERNETES.KUB_SERVER_URL}
							/>
						</>}
					<CopyableField copy label="Token" value={getKeycloakInstance().token!} />
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
