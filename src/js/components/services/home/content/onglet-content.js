import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, IconButton, Icon } from '@material-ui/core';
import {
	CardService,
	getServiceAvatar,
} from 'js/components/commons/service-card';
import { axiosURL, wrapPromise } from 'js/utils';
import conf from 'js/configuration';

const resource = wrapPromise(axiosURL(conf.CONTENT.SERVICES_URL));

const OngletContent = () => {
	const { services } = resource.read();

	const handleOpenService = (service) => window.open(service.link);

	const gridItems = services.map((service, i) => (
		<CardService
			key={i}
			title={service.title}
			subtitle={service.subtitle}
			avatar={getServiceAvatar(service)}
			actions={createActionsCarte(service)(handleOpenService)}
			contenu={createContenuCarte(service)}
		/>
	));

	return (
		<div className="contenu accueil">
			<Grid container spacing={8} classes={{ container: 'cartes' }}>
				{gridItems}
			</Grid>
		</div>
	);
};

export default OngletContent;

const createActionsCarte = (service) => (openService) => () => (
	<>
		<IconButton
			color="secondary"
			aria-label="ouvir"
			onClick={() => openService(service)}
		>
			<Icon>launch</Icon>
		</IconButton>
		<Link to={`/services/${service.id}`}>
			<IconButton
				className="more-details"
				color="secondary"
				aria-label="plus de détails"
				onClick={() => {}}
			>
				<Icon>more_horiz</Icon>
			</IconButton>
		</Link>
	</>
);

const createContenuCarte = (service) => () => (
	<div className="paragraphe">
		<div className="titre">Description</div>
		<div className="corps">{service.description}</div>
	</div>
);
