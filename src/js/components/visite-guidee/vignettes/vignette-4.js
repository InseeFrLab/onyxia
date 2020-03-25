import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Next } from './../vignette-commons';
import { WarnIcon } from 'js/components/commons/icons';

export default {
	description: () => (
		<React.Fragment>
			<Typography variant="h6" gutterBottom>
				Catalogue du libre service
			</Typography>
			<Typography variant="body1" gutterBottom>
				Le catalogue vous permet de parcourir l&rsquo;ensemble de l&rsquo;offre
				disponible et de démarrer les applications en quelques clics seulement.
			</Typography>
			<Typography variant="body1" gutterBottom>
				<span style={{ float: 'left', marginRight: '12px' }}>
					<WarnIcon />
				</span>
				Les services personnels de la plateforme sont éphémères. Les données que
				vous y chargez disparaissent lorsque le service s&rsquo;interrompt, ce
				qui arrive lors d&rsquo;opérations de maintenance et aussi chaque
				week-end.
			</Typography>
		</React.Fragment>
	),
	actions: ({ next }) => <Next next={next} />,
};
