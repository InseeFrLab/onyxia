import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Typography, Fab, Icon } from '@mui/material';
import Paper from '@mui/material/Paper';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Loader from 'js/components/commons/loader';
import { getAvatar } from 'js/utils/service-utils';
import { restApiPaths } from 'js/restApiPaths';
import { prAxiosInstance } from "core/adapters/officialOnyxiaApiClient";
import { routes } from "ui/routes";

export const Service = ({ idCatalogue, idService }) => {
	const [service, setService] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {

		(async () => {

			(await prAxiosInstance)(`${restApiPaths.catalogue}/${idCatalogue}/${idService}`)
				.then(({ data }) => data)
				.then((res) => {
					setService(res);
					setLoading(false);
				});


		})();


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
							{getAvatar(service)}
							{getDescription(service)}
							{getPreinstallNotes(service)}
							{getAjouter(idCatalogue)(idService)}
						</>
					)}
			</div>
		</>
	);
};

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
			<a {...routes.catalog({
				"optionalTrailingPath": `${idCatalogue}/${idService}/deploiement`
			}).link}>
				<Fab color="primary" aria-label="Nouveau">
					<Icon>add</Icon>
				</Fab>
			</a>
		</div>
	) : null;
