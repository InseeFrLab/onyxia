import React from 'react';
import Typography from '@material-ui/core/Typography';
import { LinkTo } from './../vignette-commons';
import { BecherIcon } from 'js/components/commons/icons';

export default {
	description: class Diapo extends React.Component {
		render = () => (
			<>
				<Typography variant="h6" gutterBottom>
					Nouveau service personnel
				</Typography>
				<Typography variant="body1" gutterBottom>
					Votre service est en cours de création. Vous pouvez suivre
					l&rsquo;avancement de l&rsquo;opération sur votre laboratoire
					personnel.
				</Typography>
			</>
		);
	},
	actions: ({ next }) => (
		<LinkTo
			to="/my-services"
			onClick={next}
			component={() => <BecherIcon height={20} width={20} color="#fff" />}
		/>
	),
};
