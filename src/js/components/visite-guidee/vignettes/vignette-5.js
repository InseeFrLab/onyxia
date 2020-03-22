import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Redirect } from 'react-router-dom';
import { Prec, LinkTo, Arrow } from './../vignette-commons';

export default {
	description: class Diapo extends React.Component {
		state = { redirect: false };
		componentDidMount() {
			const bouton = document.getElementById('bouton-service-drawio');
			if (bouton){
				bouton.style.zIndex = 9999;
				bouton.style.border = '1px solid red';
				bouton.onclick = e => {
					e.stopImmediatePropagation();
					this.props.setFirstService(this.props.firstService);
					this.setState({ redirect: true });
					this.props.next();
				};
			}
		}
		render = () => {
			const bouton = document.getElementById('bouton-service-drawio');
			return this.state.redirect ? (
				<Redirect to="/my-lab/catalogue/Draw.io" />
			) : (
				<React.Fragment>
					<Arrow dom={bouton} />
					<Typography variant="h6" gutterBottom>
						Catalogue du libre service
					</Typography>
					<Typography variant="body1" gutterBottom>
						Une carte fournit la description de chacun des services à votre
						disposition. Un bouton bleu permet d&rsquo;accéder à la page de
						création.
					</Typography>
					<Typography variant="body1" gutterBottom>
						Créons ensemble votre premier service !
					</Typography>
				</React.Fragment>
			);
		};
	},
	actions: ({ firstService, next, setFirstService, prec }) => (
		<React.Fragment>
			<Prec prec={prec} />
			<LinkTo
				to="/my-lab/catalogue/Draw.io"
				type="add"
				onClick={() => {
					setFirstService(firstService);
					next();
				}}
			/>
		</React.Fragment>
	),
};
