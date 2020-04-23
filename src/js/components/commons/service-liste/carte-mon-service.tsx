import React, { useEffect } from 'react';
import { Icon, IconButton, Badge } from '@material-ui/core/';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { CarteService } from 'js/components/commons/service-liste';
import Pile from 'js/components/commons/pile';
import Chronometer from 'js/components/commons/chronometer';
import { extractServiceId } from 'js/utils/service-utils';
import { serviceType } from 'js/components/commons/prop-types';
import { getServiceAvatar, getTitle, getSubtitle } from './carte-service.utils';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { Service, ServiceStatus } from 'js/model';
import './liste-cartes.scss';

interface Props {
	service: Service;
	suivreStatutService: (service: Service) => void;
	handleClickLaunch: (func: () => void) => void;
	wait?: boolean;
}

const CarteMonService = ({
	service,
	suivreStatutService,
	handleClickLaunch,
	wait,
}: Props) => {
	useEffect(() => {
		if (suivreStatutService) {
			suivreStatutService(service);
		}
	});
	const expiration = dateExpiration({ env: {} }); // TODO : restore this
	return (
		<CarteService
			id={service.id}
			expiration={expiration && isExpired(expiration)}
			wait={wait}
			pause={service.instances === 0}
			title={getTitle(service)}
			subtitle={getSubtitle(service)}
			avatar={getServiceAvatar(service)}
			actions={getActions(service)(handleClickLaunch)}
			contenu={getContenu(service)}
		/>
	);
};

CarteMonService.propTypes = {
	service: serviceType,
	handleClickLaunch: PropTypes.func.isRequired,
	wait: PropTypes.bool.isRequired,
};

const getActions = (service) => (launch) => () => (
	<>
		{getLaunchIcon(service)(launch)}
		<Link to={`/my-lab/mes-services/${extractServiceId(service.id)}`}>
			<IconButton
				id={`bouton-details-${service.id}`}
				color="secondary"
				aria-label="plus de détails"
			>
				<Icon>build</Icon>
			</IconButton>
		</Link>
	</>
);

const getLaunchIcon = (service: Service) => (handleClickLaunch) =>
	service.status === ServiceStatus.Running ? (
		service.urls ? (
			<IconButton
				color="secondary"
				aria-label="ouvrir"
				onClick={() => window.open(getServiceUrl(service))}
			>
				<Icon>launch</Icon>
			</IconButton>
		) : null
	) : (
		<IconButton
			color="secondary"
			aria-label="démarrer"
			onClick={() => handleClickLaunch(service)}
		>
			<PlayArrowIcon fontSize="large" />
		</IconButton>
	);

const getContenu = (service) => () => {
	const max = 5;
	const cpu = Math.ceil(computeCpu(service.cpus)(max));
	const ram = Math.ceil(compterRam(service.mem)(max));
	return (
		<>
			<div className="paragraphe">
				{service.status === 'RUNNING' && service.startedAt ? (
					<>
						<div className="titre">Temps d&rsquo;activité</div>
						<Chronometer start={service.startedAt} />
					</>
				) : null}
			</div>
			{service.instances ? (
				<div className="paragraphe">
					<div className="titre">Consommations</div>
					<span className="pile">
						<Pile
							small
							size={cpu}
							sizeMax={max}
							label={getLabel('cpu')(cpu * 2)}
						/>
					</span>
					<span className="pile">
						<Pile
							small
							size={ram}
							sizeMax={max}
							label={getLabel('mem')(ram * 2)}
						/>
					</span>
				</div>
			) : null}
		</>
	);
};

const computeCpu = (cpu) => (max) => Math.min(max, (cpu * 10) / 2);

const compterRam = (ram) => (max) => Math.min(max, ram / 2048);

const getLabel = (label) => (how) => () => (
	<span className="pile-label">
		<Badge badgeContent={how} color="primary" classes={{ badge: 'badge' }}>
			<span className="titre-label">{label}</span>
		</Badge>
	</span>
);

const getServiceUrl = (service: Service) =>
	service.urls ? service.urls[0].split(',')[0] : undefined;

export default CarteMonService;

const dateExpiration = ({ env }) =>
	env && env.AWS_EXPIRATION
		? dayjs(env.AWS_EXPIRATION).format('YYYY-MM-DDTHH:mm:ssZ')
		: undefined;

const isExpired = (date) =>
	(date && !date.isValid()) ||
	(date && date.isValid() && date.valueOf() - dayjs().valueOf() <= 0);
