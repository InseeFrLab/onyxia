import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Bye } from './../vignette-commons';
import D from 'js/i18n';

/* eslint-disable import/no-anonymous-default-export */
export default {
	description: () => (
		<Typography variant="body1" gutterBottom>
			{D.guidedTourClosing}
		</Typography>
	),
	actions: () => <Bye />,
};
