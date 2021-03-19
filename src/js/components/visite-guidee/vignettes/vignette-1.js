import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Fab, IconButton, Icon } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import { Next, CarteMask } from './../vignette-commons';
import { MinioIcon, GitlabIcon } from 'js/components/commons/icons';
import { getValidatedEnv } from "app/validatedEnv";
import D from 'js/i18n';

export default {
	description: class Vignette1 extends React.Component {
		state = { dom: null };
		componentDidMount() {
			const cartes = document.getElementsByClassName('carte-service');
			let index = 0;
			let sens = 1;
			this.timer = window.setInterval(() => {
				this.setState({ dom: cartes[index] });
				if (index === cartes.length) {
					sens = -1;
				}
				if (index === 0) {
					sens = 1;
				}
				index += sens;
			}, 500);
		}

		componentWillUnmount() {
			window.clearInterval(this.timer);
		}
		render() {
			return (
				<>
					<CarteMask dom={this.state.dom} />
					<Typography variant="h6" gutterBottom>
						{D.guidedTourSharedServicesTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette1Text1}
					</Typography>
					<p>
						<Tooltip title="gitlab">
							<IconButton>
								<GitlabIcon height={20} width={20} />
							</IconButton>
						</Tooltip>
						<Tooltip title="MinioIcon">
							<IconButton>
								<MinioIcon height={20} width={20} />
							</IconButton>
						</Tooltip>
						...
					</p>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette1Text2}
					</Typography>
				</>
			);
		}
	},
	actions: ({ next }) => (
		<>
			<Tooltip title="Chat">
				<Fab color="primary" onClick={() => window.open(getValidatedEnv().CHAT.URL)}>
					<Icon height={20} width={20}>
						group
					</Icon>
				</Fab>
			</Tooltip>
			<Next next={next} />
		</>
	),
};
