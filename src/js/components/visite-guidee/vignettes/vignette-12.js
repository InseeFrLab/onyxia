import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Prec, Next } from './../vignette-commons';

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
					<Typography variant="h6" gutterBottom>
						Mon service
					</Typography>
					<Typography variant="body1" gutterBottom>
						Sur la page de votre service, vous trouverez l&rsquo;ensemble des
						informations propre à celui-ci. Vous pouvez ici modifier un certain
						nombre d&rsquo;éléments comme les ressources mises en oeuvre par
						l&rsquo;application.
					</Typography>
					<Typography variant="body1" gutterBottom>
						Des boutons d&rsquo;action vous permettent de contrôler l&rsquo;état
						de votre service et de le supprimer.
					</Typography>
				</>
			);
		}
	},
	actions: ({ prec, next, serviceCree }) => {
		return (
			<>
				<Prec prec={prec} />
				<Next next={next} />
			</>
		);
	},
};
