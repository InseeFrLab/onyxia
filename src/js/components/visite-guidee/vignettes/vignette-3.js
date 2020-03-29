import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Prec, LinkTo } from './../vignette-commons';
import { CatalogueIcon } from 'js/components/commons/icons';

export default {
	description: () => {
		//document.getElementById('onglets-accueil-services').style.zIndex = 99999;
		//document.getElementById('onglets-accueil-services').style.outline =
		//	'1px solid red';
		return (
			<>
				<Typography variant="h6" gutterBottom>
					Les services partagés
				</Typography>
				<Typography variant="body1" gutterBottom>
					Des onglets permettent de parcourir les services selon leur niveau de
					maturité. L&rsquo;onglet alpha regroupe des applications peu mûres,
					beta des applications intermédiaires et stable, comme le nom
					l&rsquo;indique, des applications couramment utilisées, mises à jour,
					et sans dysfonctionnement spécifique.
				</Typography>
				<Typography variant="body1" gutterBottom>
					Poursuivons la visite avec le catalogue du libre-service.
				</Typography>
			</>
		);
	},
	actions: ({ next, prec }) => (
		<>
			<Prec prec={prec} />
			<LinkTo
				to="/my-lab/catalogue"
				onClick={next}
				component={() => <CatalogueIcon width={20} height={20} color="#fff" />}
			/>
		</>
	),
};
