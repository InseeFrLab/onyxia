import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Fab, IconButton } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import { Next, CarteMask } from './../vignette-commons';
import { RocketChatIcon, GitlabIcon } from 'js/components/commons/icons';
import conf from 'js/configuration';

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
						Les services partagés
					</Typography>
					<Typography variant="body1" gutterBottom>
						Les cartes vous présentent ici l&rsquo;ensemble des services
						partagés à votre disposition. Il s&rsquo;agit d&rsquo;applications
						collaboratives, telles que des éditeurs de textes et tableurs
						permettant de travailler simultanément sur un même document, et de
						services techniques transverses, comme le service
						d&rsquo;authentification et le service de géocodage.
					</Typography>
					<p>
						<Tooltip title="gitlab">
							<IconButton>
								<GitlabIcon height={20} width={20} />
							</IconButton>
						</Tooltip>
						<Tooltip title="RocketChat">
							<IconButton>
								<RocketChatIcon height={20} width={20} />
							</IconButton>
						</Tooltip>
						...
					</p>
					<Typography variant="body1" gutterBottom>
						Le catalogue s&rsquo;enrichira au fil du temps, mais vous pouvez dès
						à présent faire vos propositions sur le service de messagerie
						instantanée RocketChat.
					</Typography>
				</>
			);
		}
	},
	actions: ({ next }) => (
		<>
			<Tooltip title="RocketChat">
				<Fab color="primary" onClick={() => window.open(conf.CHAT.URL)}>
					<RocketChatIcon height={20} width={20} />
				</Fab>
			</Tooltip>
			<Next next={next} />
		</>
	),
};
