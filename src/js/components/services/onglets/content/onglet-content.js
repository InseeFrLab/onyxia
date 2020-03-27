import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, IconButton, Icon } from '@material-ui/core';
import {
	CarteService,
	getColorClassStateService,
	getServiceAvatar,
	getTitle,
	getSubtitle,
} from 'js/components/commons/service-liste';
import { axiosPublic, wrapPromise } from 'js/utils';
import api from 'js/redux/api';

const resource = wrapPromise(axiosPublic(api.services));

const OngletContent = (props) => {
	const services = resource.read();
	const { tab, setServiceSelectionne } = props;

	const handleOpenService = (service) =>
		window.open(service.labels.ONYXIA_URL.split(',')[0]);

	const handleMoreDetailsService = (service) => setServiceSelectionne(service);

	const gridItems = services
		.filter((s) => !s.labels.ONYXIA_STATUS || s.labels.ONYXIA_STATUS === tab)
		.map((service, i) => (
			<CarteService
				down={getColorClassStateService(service) === 'down'}
				key={i}
				title={getTitle(service)}
				subtitle={getSubtitle(service)}
				avatar={getServiceAvatar(service)}
				actions={createActionsCarte(service)(handleOpenService)(
					handleMoreDetailsService
				)}
				contenu={createContenuCarte(service)}
			/>
		));

	return (
		<Grid container spacing={8} classes={{ container: 'cartes' }}>
			{gridItems}
		</Grid>
	);
};

export default OngletContent;

const createActionsCarte = (service) => (openService) => (
	openDetails
) => () => (
	<React.Fragment>
		<IconButton
			color="secondary"
			aria-label="ouvir"
			onClick={() => openService(service)}
		>
			<Icon>launch</Icon>
		</IconButton>
		<Link to={`/services${service.id}`}>
			<IconButton
				className="more-details"
				color="secondary"
				aria-label="plus de détails"
				onClick={() => openDetails(service)}
			>
				<Icon>more_horiz</Icon>
			</IconButton>
		</Link>
	</React.Fragment>
);

const createContenuCarte = (service) => () => (
	<div className="paragraphe">
		<div className="titre">Description</div>
		<div className="corps">{service.labels.ONYXIA_DESCRIPTION}</div>
	</div>
);
