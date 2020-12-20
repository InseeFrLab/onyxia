import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Redirect } from 'react-router-dom';
import { Prec, LinkTo, Arrow } from './../vignette-commons';
import D from 'js/i18n';

/* eslint-disable import/no-anonymous-default-export */
export default {
	description: class Diapo extends React.Component {
		state = { redirect: false };
		componentDidMount() {
			const bouton = document.getElementById('bouton-service-drawio');
			if (bouton) {
				bouton.style.zIndex = 9999;
				bouton.style.border = '1px solid red';
				bouton.onclick = (e) => {
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
				<Redirect to="/my-lab/catalogue/inseefrlab-datascience" />
			) : (
				<>
					<Arrow dom={bouton} />
					<Typography variant="h6" gutterBottom>
						{D.guidedTourSelfServiceCatalogTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette5Text1}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette5Text2}
					</Typography>
				</>
			);
		};
	},
	actions: ({ firstService, next, prec }) => (
		<>
			<Prec prec={prec} />
			<LinkTo
				to="/my-lab/catalogue/inseefrlab-datascience"
				type="add"
				title={D.btnSelfServiceCreation}
				onClick={next}
			/>
		</>
	),
};
