import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Both } from './../vignette-commons';

export default {
	description: () => {
		return (
			<React.Fragment>
				<Typography variant="h6" gutterBottom>
					Mon labo
				</Typography>
				<Typography variant="body1" gutterBottom>
					Votre labo contient tous les services que vous avez crées sous forme
					de cartes. Certains sont regroupés lorsqu&rsquo;ils sont instanciés
					par lot. Chacune des cartes vous fournit des indicateurs synthétiques
					sur vos consommations.
				</Typography>
				<Typography variant="body1" gutterBottom>
					Si votre service n&rsquo;est pas encore disponible, des roues crantées
					vous en bloqueront l&rsquo;accès temporairement.
				</Typography>
			</React.Fragment>
		);
	},
	actions: ({ next, prec }) => <Both next={next} prec={prec} />,
};
