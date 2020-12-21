import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';
import { Icon, IconButton } from '@material-ui/core';
import D from 'js/i18n';

 
export default {
	description: () => {
		return (
			<>
				<Typography variant="h6" gutterBottom>
					{D.guidedTourMyLabTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette9Text1}
				</Typography>
				<Typography variant="body1" gutterBottom>
					<IconButton color="secondary">
						<Icon fontSize="small">open_in_new</Icon>
					</IconButton>
					{D.guidedTourVignette9Text2}
				</Typography>
			</>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
