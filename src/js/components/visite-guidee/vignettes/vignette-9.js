import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';
import { Icon, IconButton } from '@material-ui/core';

export default {
	description: () => {
		return (
			<React.Fragment>
				<Typography variant="h6" gutterBottom>
					Mon labo
				</Typography>
				<Typography variant="body1" gutterBottom>
					Une fois actif, vous pouvez accéder au service dès lors que celui-ci
					dispose d&rsquo;une adresse. Ce n&rsquo;est pas le cas de tous les
					services. PostgreSQL ne possède pas d&rsquo;interface web. Il vous
					faut dans ce cas utiliser un second service, pgadmin pour manipuler
					votre base de données.
				</Typography>
				<Typography variant="body1" gutterBottom>
					<IconButton color="secondary">
						<Icon fontSize="small">open_in_new</Icon>
					</IconButton>
					ouvre l&rsquo;interface de votre application.
				</Typography>
			</React.Fragment>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
