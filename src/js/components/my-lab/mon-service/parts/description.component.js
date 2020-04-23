import React from 'react';
import { Paper, Typography } from '@material-ui/core/';
import Titre from 'js/components/commons/titre';
import CopyableField from 'js/components/commons/copyable-field';

const Description = ({ service, wait, getUrlFields }) => (
	<Paper className="paragraphe" elevation={1}>
		<Typography variant="h3" gutterBottom>
			<Titre titre="Description" wait={wait} />
		</Typography>
		<Typography variant="body1" color="textPrimary" gutterBottom>
			{service.labels.ONYXIA_DESCRIPTION}
		</Typography>
		{service.urls ? getUrlFields(service.urls) : null}
		{service.labels.ONYXIA_PRIVATE_ENDPOINT ? (
			<CopyableField
				copy
				label="url"
				value={service.labels.ONYXIA_PRIVATE_ENDPOINT}
			/>
		) : null}
	</Paper>
);

export default Description;
