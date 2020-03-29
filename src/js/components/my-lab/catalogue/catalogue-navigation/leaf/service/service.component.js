import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Typography, Fab, Icon } from '@material-ui/core';
import { Avatar } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Loader from 'js/components/commons/loader';
import { axiosPublic } from 'js/utils';
import api from 'js/redux/api';

const Service = ({ idCatalogue, idService }) => {
	const [service, setService] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		axiosPublic(`${api.catalogue}/${idCatalogue}/${idService}`).then((res) => {
			setService(res);
			setLoading(false);
		});
	}, [idCatalogue, idService]);

	return (
		<>
			<div className="en-tete">
				{loading ? (
					<Loader />
				) : (
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						{service.name}
					</Typography>
				)}
			</div>
			<FilDAriane fil={fil.serviceCatalogue(idCatalogue, idService)} />
			<div className="contenu service">
				{loading ? (
					<Loader em={18} />
				) : (
					<>
						{getLogo(service)}
						{getDescription(service)}
						{getPreinstallNotes(service)}
						{getAjouter(idCatalogue)(idService)}
					</>
				)}
			</div>
		</>
	);
};

export default Service;

Service.propTypes = {
	idCatalogue: PropTypes.string.isRequired,
	idService: PropTypes.string.isRequired,
};

const getDescription = (service) =>
	service ? (
		<Paper className="paper" elevation={1}>
			<Typography variant="h3" align="left">
				Description
			</Typography>

			<Typography variant="body1" gutterBottom>
				{service.description}
			</Typography>
		</Paper>
	) : null;

const getPreinstallNotes = (service) =>
	service ? (
		<Paper className="paper" elevation={1}>
			<Typography variant="h3" align="left">
				Notes d'installation
			</Typography>

			<Typography variant="body1" gutterBottom>
				{service.preInstallNotes}
			</Typography>
		</Paper>
	) : null;

const getAjouter = (idCatalogue) => (idService) =>
	idService ? (
		<div className="ajouter">
			<Link to={`/my-lab/catalogue/${idCatalogue}/${idService}/deploiement`}>
				<Fab color="primary" aria-label="Nouveau">
					<Icon>add</Icon>
				</Fab>
			</Link>
		</div>
	) : null;

const getLogo = (service) =>
	service &&
	service.resource &&
	service.resource.resource &&
	service.resource.resource.images['icon-large'] ? (
		<div className="logo-service">
			<img
				src={service.resource.resource.images['icon-large']}
				alt="logo service"
			/>
		</div>
	) : (
		<Avatar>{service.name.substring(0, 1)}</Avatar>
	);
