import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both, Arrow } from './../vignette-commons';
import { Icon, Fab } from '@material-ui/core';

export default {
	description: () => {
		const elmts = document.getElementsByClassName('onyxia-toolbar');
		const toolbar = elmts.length > 0 ? elmts[0] : null;
		return (
			<>
				<Arrow dom={toolbar} />
				<Typography variant="h6" gutterBottom>
					Mon labo
				</Typography>
				<Typography variant="body1" gutterBottom>
					Au dessus des cartes de services, une barre d&rsquo;outils vous permet
					d&rsquo;arrêter l&rsquo;ensemble des applications actives ou de
					rafraîchir la liste.
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
