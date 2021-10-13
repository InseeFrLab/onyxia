import React from 'react';
import Typography from '@mui/material/Typography';
import { Both } from './../vignette-commons';
import { Icon, IconButton } from '@mui/material';
import { WorkInProgress } from 'js/components/commons/icons';
import D from 'js/i18n';

 
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
