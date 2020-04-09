import React from 'react';
import { Paper, Icon, Fab } from '@material-ui/core/';
import { getGrafanaServiceUrl } from 'js/utils';
import { GrafanaIcon, MinioIcon } from 'js/components/commons/icons';

const ServiceToolbar = ({
	service,
	wait,
	handleDelete,
	changerEtatService,
	refreshToken,
}) => (
	<Paper className="onyxia-toolbar" elevation={1}>
		<Fab
			disabled={wait}
			aria-label="supprimer"
			className="bouton"
			color="secondary"
			onClick={handleDelete}
		>
			<Icon>delete</Icon>
		</Fab>
		<Fab
			disabled={wait}
			color={service.instances ? 'secondary' : 'primary'}
			aria-label={service.instances ? 'pause' : 'démarrer'}
			className="bouton"
			onClick={() => changerEtatService(service)}
		>
			<Icon>{service.instances ? 'pause' : 'play_arrow'}</Icon>
		</Fab>
		{service.env && service.env.AWS_EXPIRATION ? (
			<Fab
				disabled={wait}
				aria-label="Grafana"
				color="secondary"
				className="bouton"
				onClick={refreshToken}
				title="renouveler le jeton minio"
			>
				<MinioIcon width={30} height={30} />
			</Fab>
		) : null}
		<Fab
			disabled={wait}
			aria-label="Grafana"
			color="primary"
			className="bouton"
			onClick={() => window.open(getGrafanaServiceUrl(service))}
		>
			<GrafanaIcon />
		</Fab>

		{service.labels.ONYXIA_URL ? (
			<Fab
				disabled={wait}
				aria-label="ouvrir"
				color="primary"
				className="bouton"
				onClick={() => window.open(service.labels.ONYXIA_URL)}
			>
				<Icon>open_in_new</Icon>
			</Fab>
		) : null}
	</Paper>
);

export default ServiceToolbar;
