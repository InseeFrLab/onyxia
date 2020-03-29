import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';
import { Icon, IconButton } from '@material-ui/core';
import { WorkInProgress } from 'js/components/commons/icons';

export default {
	description: () => {
		//document.getElementById('onglets-accueil-services').style.zIndex = 1000;
		return (
			<>
				<Typography variant="h6" gutterBottom>
					Les services partagés
				</Typography>
				<Typography variant="body1" gutterBottom>
					Sur chaque carte se trouve un bouton pour ouvrir la page du service,
					un autre pour accéder à ses détails.
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
					Un cône de chantier vous barre l&rsquo;accès lorsque le service est
					indisponible.
				</Typography>
				<WorkInProgress />
			</>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
