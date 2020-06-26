import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button } from '@material-ui/core';
import { Arrow } from './../vignette-commons';
import D from 'js/i18n';

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
						{D.guidedTourSelfServiceCreationTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette6Text1}
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
				{D.guidedTourVignette6Text2}
			</Button>
		</>
	),
};
