import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Bye } from './../vignette-commons';

export default {
	description: () => (
		<Typography variant="body1" gutterBottom>
			Merci de votre visite !
		</Typography>
	),
	actions: () => <Bye />,
};
