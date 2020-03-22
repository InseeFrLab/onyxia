import React from 'react';
import PropTypes from 'prop-types';
import { GrafanaIcon, RocketChatIcon, GithubIcon } from 'js/components/commons/icons';
import { Typography, Paper, Fab, Icon } from '@material-ui/core';
// import { getServiceAvatar } from "js/components/commons/service-liste";
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';

class DetailsService extends React.Component {
	state = { defaultValue: '' };
	constructor(props) {
		super(props);
		this.state.defaultValue = 'rigoler';
		const serviceId = window.location.pathname.replace('/services', '');
		if (!props.serviceSelectionne) {
			props.loadServiceCollaboratif(serviceId);
		}
	}
	render() {
		const { serviceSelectionne: service } = this.props;
		if (!service) return null;
		const {
			ONYXIA_URL,
			ONYXIA_CHANNEL,
			ONYXIA_MONITORING,
			ONYXIA_TITLE,
			ONYXIA_SUBTITLE,
			ONYXIA_LOGO,
			ONYXIA_CONTRIBUTE
		} = service.labels;
		return (
			<React.Fragment>
				<div className="en-tete">
					<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
						<span>{ONYXIA_TITLE}</span>
					</Typography>
					<Typography variant="h3" align="center" color="textPrimary" gutterBottom>
						<span>{ONYXIA_SUBTITLE}</span>
					</Typography>
				</div>
				<FilDAriane fil={fil.services(service)} />

				<div className="contenu details-service">
					<div className="logo-service">
						<img src={ONYXIA_LOGO} alt="logo" />
					</div>
					<Paper className="onyxia-toolbar" elevation={1}>
						{ONYXIA_MONITORING ? (
							<Fab
								className="bouton"
								color="primary"
								title="grafana"
								onClick={() => window.open(ONYXIA_MONITORING)}
							>
								<GrafanaIcon />
							</Fab>
						) : null}
						{ONYXIA_CHANNEL ? (
							<Fab
								className="bouton"
								color="primary"
								title="rocketchat"
								onClick={() => window.open(ONYXIA_CHANNEL)}
							>
								<RocketChatIcon />
							</Fab>
						) : null}
						{ONYXIA_CONTRIBUTE ? (
							<Fab
								className="bouton"
								color="primary"
								title="contribuer"
								onClick={() => window.open(ONYXIA_CONTRIBUTE)}
							>
								<GithubIcon width={20} height={20} />
							</Fab>
						) : null}
						{ONYXIA_URL ? (
							<Fab
								className="bouton"
								color="secondary"
								title="service"
								onClick={() => window.open(ONYXIA_URL)}
							>
								<Icon>open_in_new</Icon>
							</Fab>
						) : null}
					</Paper>

					<Paper className="paper" elevation={1}>
						<Typography variant="h3" gutterBottom>
							Description
						</Typography>
						<Typography variant="body1" color="textPrimary" gutterBottom>
							{service.labels.ONYXIA_DESCRIPTION}
						</Typography>
					</Paper>

					{service.labels.ONYXIA_CAUTION ? (
						<Paper className="paper" elevation={1}>
							<Typography variant="h3" gutterBottom>
								Caution
							</Typography>
							<Typography variant="body1" color="textPrimary" gutterBottom>
								{service.labels.ONYXIA_CAUTION}
							</Typography>
							<Typography variant="body1" color="textPrimary" gutterBottom>
								{getOnyxiaStatus(service.labels.ONYXIA_STATUS)}
							</Typography>
						</Paper>
					) : null}
				</div>
			</React.Fragment>
		);
	}
}
DetailsService.propTypes = {
	serviceSelectionne: PropTypes.shape({ id: PropTypes.string.isRequired })
};

const getOnyxiaStatus = (status) =>
	status === 'alpha'
		? 'Votre service est en version alpha. Il vous pétera à la tronche à la première occasion !'
		: status === 'beta'
			? "Votre service est en version beta. Cela peut paraître plus sûr, mais ce n'est qu'une illusion !"
			: status === 'stable'
				? "Votre service est en version stable. Il ne vous pétera à la tronche que si Fred essaie d'y toucher le week-end ;)"
				: null;

export default DetailsService;
