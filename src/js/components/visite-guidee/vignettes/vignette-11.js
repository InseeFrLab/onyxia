import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Icon } from '@material-ui/core';
import { Prec, LinkTo, Arrow } from './../vignette-commons';
import { extractServiceId } from 'js/utils';
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
					<Arrow dom={this.state.dom} />
					<Typography variant="h6" gutterBottom>
						{D.guidedTourMyLabTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette11Text1}
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
				title={D.btnDetails}
				component={() => <Icon>more_horiz</Icon>}
			/>
		</>
	),
};
