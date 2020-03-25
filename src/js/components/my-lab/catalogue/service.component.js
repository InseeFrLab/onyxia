import React from 'react';
import { Typography, Fab, Icon } from '@material-ui/core';
import { Avatar } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Paper from '@material-ui/core/Paper';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class Service extends React.Component {
	constructor(props) {
		super(props);
		// if (!props.service) {
		props.chargerService(props.match.params.idService);
		// }
	}
	render() {
		const { service } = this.props;
		if (!service) return null;
		return (
			<React.Fragment>
				<div className="en-tete en-tete-service">
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						{service ? (
							<React.Fragment>{service.name}</React.Fragment>
						) : (
							'en cours de chargement...'
						)}
					</Typography>
				</div>
				{service ? (
					<FilDAriane fil={fil.serviceCatalogue(service.name)} />
				) : null}
				<div className="contenu service">
					{getLogo(service)}
					{getDescription(service)}
					{getPreinstallNotes(service)}
					{getAjouter(service)}
				</div>
			</React.Fragment>
		);
	}
}

Service.propTypes = {
	service: PropTypes.shape({}),
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

const getAjouter = (service) =>
	service ? (
		<div className="ajouter">
			<Link to={`/my-lab/catalogue/${service.name}/deploiement`}>
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

export default React.memo(Service);
