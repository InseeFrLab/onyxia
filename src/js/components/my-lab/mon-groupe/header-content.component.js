import React from 'react';
import { Typography } from '@material-ui/core/';

export default ({ services }) => {
	return (
		<div className="en-tete">
			<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
				{getGroupeName(services)}
			</Typography>
		</div>
	);
};

const getGroupeName = services =>
	services && services.length > 0
		? services[0].labels.ONYXIA_TITLE
		: "Groupe d'applications";
