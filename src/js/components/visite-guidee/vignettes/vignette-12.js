import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Prec, Next } from './../vignette-commons';
import D from 'js/i18n';

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
						{D.guidedTourMySelfServiceTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette12Text1}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette12Text2}
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
