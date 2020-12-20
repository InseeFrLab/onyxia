import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';
import D from 'js/i18n';

/* eslint-disable import/no-anonymous-default-export */
export default {
	description: () => {
		return (
			<>
				<Typography variant="h6" gutterBottom>
					{D.guidedTourMyLabTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette8Text1}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette8Text2}
				</Typography>
			</>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
