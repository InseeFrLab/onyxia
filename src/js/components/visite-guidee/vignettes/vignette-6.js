import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button } from '@material-ui/core';
import { Arrow } from './../vignette-commons';

export default {
	description: class Diapo extends React.Component {
		state = { dom: null, ready: false };

		shake = () => {
			const { creerPremier, next } = this.props;
			window.setTimeout(() => {
				const bouton = document.getElementById('bouton-creer-nouveau-service');
				if (bouton) {
					bouton.style.zIndex = 1302;
					bouton.onclick = (e) => {
						e.stopImmediatePropagation();
						creerPremier();
						next();
					};
					this.setState({
						dom: bouton,
						ready: true,
					});
				} else {
					this.shake();
				}
			}, 250);
		};

		componentDidMount() {
			this.shake();
		}

		render() {
			return (
				<>
					<Arrow dom={this.state.dom} />
					<Typography variant="h6" gutterBottom>
						Nouveau service personnel
					</Typography>
					<Typography variant="body1" gutterBottom>
						Sur cette page, vous pouvez configurer votre service en parcourant
						les différents onglets d&rsquo;options. Le strict nécessaire est
						rempli par défaut. Une fois terminé, vous pouvez valider la demande
						en cliquant sur le bouton créer.
					</Typography>
				</>
			);
		}
	},
	actions: ({ creerPremier, next, prec }) => (
		<>
			<Button
				variant="contained"
				mini
				color="primary"
				onClick={() => {
					creerPremier();
					next();
				}}
			>
				créer votre service
			</Button>
		</>
	),
};
