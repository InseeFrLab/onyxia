import React from 'react';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { startVisite } from 'js/redux/actions';
import VisiteGuide from './visite-guidee.component';
import { Next, LinkTo, Arrow } from './vignette-commons';

const ETAPES = [
	{
		description: () => (
			<React.Fragment>
				<Typography variant="h6" gutterBottom>
					Bienvenue sur la visite guidée d&rsquo;Onyxia !
				</Typography>
				<Typography variant="body1" gutterBottom>
					Nous sommes heureux de vous présenter le portail de la plateforme
					innovation de l&rsquo;Insee. Parcourons ensemble ses principales
					fonctionnalités.
				</Typography>
				<Typography variant="body1" gutterBottom>
					Bonne visite !
				</Typography>
			</React.Fragment>
		),
		actions: ({ next }) => <Next next={next} />,
	},
	{
		description: () => {
			const bouton = document.getElementById('bouton-mon-compte');
			return (
				<React.Fragment>
					<Arrow dom={bouton} />
					<Typography variant="h6" gutterBottom>
						Authentification
					</Typography>
					<Typography variant="body1" gutterBottom>
						La plupart des services nécessitent de savoir qui vous êtes.
					</Typography>
					<Typography variant="body1" gutterBottom>
						Vous disposez d&rsquo;un bouton de connexion sur la droite de la
						barre de navigation qui permet de vous authentifier avec votre
						compte Insee. Dès que vous solliciterez un service protégé, la boîte
						de dialogue d&rsquo;authenfication s&rsquo;ouvrira automatiquement.
					</Typography>
					<Typography variant="body1" gutterBottom>
						Commençons par la visite des services partagés.
					</Typography>
				</React.Fragment>
			);
		},
		actions: ({ startVisite }) => (
			<LinkTo to="/services" onClick={startVisite} type="home" />
		),
	},
];

const Visite = props => (
	<VisiteGuide visite={true} etapes={ETAPES} {...props} />
);

export default connect(
	undefined,
	{ startVisite }
)(Visite);
