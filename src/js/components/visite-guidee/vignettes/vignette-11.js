import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Icon } from '@material-ui/core';
import { Prec, LinkTo, Arrow } from './../vignette-commons';

export default {
	description: class Vignette extends React.Component {
		state = { dom: null };
		constructor(props) {
			super(props);
			this.service = props.serviceCree;
		}
		componentDidMount() {
			const bouton = document.getElementById(
				`bouton-details-${this.service.id}`
			);
			bouton.style.zIndex = 1302;
			bouton.onclick = (e) => this.props.next();
			this.setState({ dom: bouton });
		}
		render() {
			return (
				<>
					<Arrow dom={this.state.dom} />
					<Typography variant="h6" gutterBottom>
						Mon labo
					</Typography>
					<Typography variant="body1" gutterBottom>
						Vous pouvez maintenant accéder à la page de paramétrage de votre
						application en cliquant sur le bouton détail de la carte.
					</Typography>
				</>
			);
		}
	},
	actions: ({ prec, next, serviceCree }) => (
		<>
			<Prec prec={prec} />
			<LinkTo
				to={`/my-service/${serviceCree.id}`}
				onClick={next}
				component={() => <Icon>more_horiz</Icon>}
			/>
		</>
	),
};
