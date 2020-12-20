import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';
import { Icon, IconButton } from '@material-ui/core';
import { WorkInProgress } from 'js/components/commons/icons';
import D from 'js/i18n';

/* eslint-disable import/no-anonymous-default-export */
export default {
	description: () => {
		//document.getElementById('onglets-accueil-services').style.zIndex = 1000;
		return (
			<>
				<Typography variant="h6" gutterBottom>
					{D.guidedTourSharedServicesTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette2Text1}
				</Typography>
				<Typography variant="body1" gutterBottom>
					<span>
						<IconButton color="secondary">
							<Icon fontSize="small">open_in_new</Icon>
						</IconButton>
					</span>
					<span>
						<IconButton color="secondary">
							<Icon fontSize="small">more_horiz</Icon>
						</IconButton>
					</span>
				</Typography>
				<Typography variant="body1" gutterBottom>
				{D.guidedTourVignette2Text2}

				</Typography>
				<WorkInProgress />
			</>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
