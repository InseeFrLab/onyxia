import React from 'react';
import { Typography } from '@material-ui/core/';

interface Props {
	serviceId: string;
}

export default ({ serviceId }: Props) => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			Votre Service {serviceId}
		</Typography>
	</div>
);
