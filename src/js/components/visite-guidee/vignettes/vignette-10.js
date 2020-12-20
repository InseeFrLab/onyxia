import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both, Arrow } from './../vignette-commons';
import { Icon, Fab } from '@material-ui/core';
import D from 'js/i18n';

/* eslint-disable import/no-anonymous-default-export */
export default {
	description: () => {
		const elmts = document.getElementsByClassName('onyxia-toolbar');
		const toolbar = elmts.length > 0 ? elmts[0] : null;
		return (
			<>
				<Arrow dom={toolbar} />
				<Typography variant="h6" gutterBottom>
					{D.guidedTourMyLabTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette10Text1}
				</Typography>
				<Typography variant="body1" gutterBottom>
					<Fab color="secondary">
						<Icon fontSize="small">pause</Icon>
					</Fab>
					<Fab color="secondary">
						<Icon fontSize="small">refresh</Icon>
					</Fab>
				</Typography>
			</>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
