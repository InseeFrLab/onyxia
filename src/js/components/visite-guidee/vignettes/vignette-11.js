import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Icon } from '@material-ui/core';
import { Prec, LinkTo, Arrow } from './../vignette-commons';
import D from 'js/i18n';

const getDetailButtonElement = serviceCreeId =>
	document.querySelector(`a[href$="${serviceCreeId}"] > button`);

export default {
	"description": class Vignette extends React.Component {
		state = { dom: null, "serviceCreeId": undefined };
		isUnmounted = false;

		componentDidMount = () => {

			this.props.getServiceCreeId().then(serviceCreeId => {

				const button = getDetailButtonElement(serviceCreeId);

				if (!button) {
					return;
				}

				button.style.zIndex = 1302;
				button.onclick = () => this.props.next();

				if (this.isUnmounted) {
					return;
				}

				this.setState({ "dom": button, serviceCreeId });

			});

		};

		componentWillUnmount = () => { this.isUnmounted = true; };

		render = () => (
			<>
				{this.state.dom && <Arrow dom={this.state.dom} />}
				<Typography variant="h6" gutterBottom>
					{D.guidedTourMyLabTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette11Text1}
				</Typography>
			</>
		);
	},

	"actions": class Navigation extends React.Component {
		state = { "serviceCreeId": undefined };
		isUnmounted = false;

		componentDidMount = () => {

			this.props.getServiceCreeId().then(
				serviceCreeId => {

					if (this.isUnmounted) {
						return;
					}
					this.setState({ serviceCreeId })

				}
			);

		};

		componentWillUnmount = () => { this.isUnmounted = true; }

		render = () => (
			<>
				<Prec prec={this.props.prec} />

				{this.state.serviceCreeId === undefined ?
					<p>Loading...</p> :
					<LinkTo
						to={getDetailButtonElement(this.state.serviceCreeId).parentElement.getAttribute("href")}
						onClick={this.props.next}
						title={D.btnDetails}
						component={() => <Icon>more_horiz</Icon>}
					/>}
			</>
		);

	}
};
