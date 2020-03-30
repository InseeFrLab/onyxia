import React from 'react';
import {
	GrafanaIcon,
	RocketChatIcon,
	GithubIcon,
} from 'js/components/commons/icons';
import { Typography, Paper, Fab, Icon } from '@material-ui/core';
// import { getServiceAvatar } from "js/components/commons/service-liste";
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { axiosURL, wrapPromise } from 'js/utils';
import conf from 'js/configuration';

const resource = wrapPromise(axiosURL(conf.API.SERVICES_URL));

const DetailsService = () => {
	const { services } = resource.read();
	const serviceId = window.location.pathname.replace('/services/', '');
	// TODO: replace title by id
	const service = services.find((s) => s.title === serviceId) || {};

	const {
		urls,
		channel,
		monitoring,
		title,
		subtitle,
		logo,
		description,
		caution,
		contribute,
	} = service;

	return (
		<>
			<div className="en-tete">
				<Typography
					variant="h2"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					<span>{title}</span>
				</Typography>
				<Typography
					variant="h3"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					<span>{subtitle}</span>
				</Typography>
			</div>
			<FilDAriane fil={fil.services(service)} />
			<div className="contenu details-service">
				<div className="logo-service">
					<img src={logo} alt="logo" />
				</div>
				<Paper className="onyxia-toolbar" elevation={1}>
					{monitoring ? (
						<Fab
							className="bouton"
							color="primary"
							title="grafana"
							onClick={() => window.open(monitoring)}
						>
							<GrafanaIcon />
						</Fab>
					) : null}
					{channel ? (
						<Fab
							className="bouton"
							color="primary"
							title="rocketchat"
							onClick={() => window.open(channel)}
						>
							<RocketChatIcon />
						</Fab>
					) : null}
					{contribute ? (
						<Fab
							className="bouton"
							color="primary"
							title="contribuer"
							onClick={() => window.open(contribute)}
						>
							<GithubIcon width={20} height={20} />
						</Fab>
					) : null}
					{urls ? (
						<>
							{urls.map(({ name, url }) => (
								<Fab
									key={`service-${name}`}
									className="bouton"
									color="secondary"
									title={`service-${name}`}
									onClick={() => window.open(url)}
								>
									<Icon>open_in_new</Icon>
								</Fab>
							))}
						</>
					) : null}
				</Paper>
				{description && (
					<Paper className="paper" elevation={1}>
						<Typography variant="h3" gutterBottom>
							Description
						</Typography>
						<Typography variant="body1" color="textPrimary" gutterBottom>
							{description}
						</Typography>
					</Paper>
				)}
				{caution ? (
					<Paper className="paper" elevation={1}>
						<Typography variant="h3" gutterBottom>
							Caution
						</Typography>
						<Typography variant="body1" color="textPrimary" gutterBottom>
							{caution}
						</Typography>
					</Paper>
				) : null}
			</div>
		</>
	);
};

export default DetailsService;
