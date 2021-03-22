import React from 'react';
import { GithubIcon } from 'js/components/commons/icons';
import { Typography, Paper, Fab, Icon } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import CopyableField from 'js/components/commons/copyable-field';
import { axiosURL } from "js/utils/axios-config";
import { wrapPromise } from 'js/utils';
import { getValidatedEnv } from 'app/validatedEnv';

const env = getValidatedEnv();

const resource = wrapPromise(axiosURL(env.CONTENT.SERVICES_URL));

const DetailsService = () => {
	const { services } = resource.read();
	const serviceId = window.location.pathname.replace('/services/', '');
	const service = services.find((s) => s.id === serviceId) || {};

	const {
		urls,
		channel,
		dashboard,
		title,
		subtitle,
		logo,
		description,
		caution,
		scm,
	} = service;

	const toolbar = dashboard || channel || scm;

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
				{toolbar && (
					<Paper className="onyxia-toolbar" elevation={1}>
						{dashboard ? (
							<Fab
								className="bouton"
								color="primary"
								title="dashboard"
								onClick={() => window.open(dashboard)}
							>
								<Icon>equalizer</Icon>
							</Fab>
						) : null}
						{channel ? (
							<Fab
								className="bouton"
								color="primary"
								title="chat"
								onClick={() => window.open(channel)}
							>
								<Icon>group</Icon>
							</Fab>
						) : null}
						{scm ? (
							<Fab
								className="bouton"
								color="primary"
								title="contribuer"
								onClick={() => window.open(scm)}
							>
								<GithubIcon width={20} height={20} />
							</Fab>
						) : null}
					</Paper>
				)}
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
				{urls.length > 0 && (
					<Paper className="paper" elevation={1}>
						<Typography variant="h3" align="left">
							Services associés
						</Typography>
						{urls.map(({ name, url, description }) => (
							<CopyableField
								key={url}
								copy
								label={name}
								description={description}
								value={url || ''}
							/>
						))}
					</Paper>
				)}
			</div>
		</>
	);
};

export default DetailsService;
