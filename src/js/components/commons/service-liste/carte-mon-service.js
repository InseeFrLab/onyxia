import React from 'react';
import { Icon, IconButton, Badge } from '@material-ui/core/';
import PropTypes from 'prop-types';
import Moment from 'moment';
import { Link } from 'react-router-dom';
import { CarteService } from 'js/components/commons/service-liste';
import Pile from 'js/components/commons/pile';
import Chronometer from 'js/components/commons/chronometer';
import { extractServiceId } from 'js/utils';
import { serviceType } from 'js/components/commons/prop-types';
import { getServiceAvatar, getTitle, getSubtitle } from './carte-service.utils';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

/*
 * carte des apps des pages mon labo.
 */

class CarteMonService extends React.Component {
	componentDidMount() {
		this.props.suivreStatutService(this.props.service);
	}

	render() {
		const { service, handleClickLaunch, wait = false } = this.props;
		const expiration = dateExpiration(service);
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
	}
}

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

const getLaunchIcon = (service) => (handleClickLaunch) =>
	service.tasksRunning ? (
		service.labels.ONYXIA_URL ? (
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
				{service.instances && service.tasksRunning ? (
					<>
						<div className="titre">Temps d&rsquo;activité</div>
						<Chronometer start={service.tasks[0].startedAt} />
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

const getServiceUrl = ({ labels: { ONYXIA_URL } }) =>
	ONYXIA_URL ? ONYXIA_URL.split(',')[0] : undefined;

CarteMonService.propTypes = {
	service: serviceType,
	handleClickLaunch: PropTypes.func.isRequired,
	wait: PropTypes.bool.isRequired,
};

export default CarteMonService;

const dateExpiration = ({ env }) =>
	env && env.AWS_EXPIRATION
		? Moment(env.AWS_EXPIRATION, 'YYYY-MM-DDTHH:mm:ssZ')
		: undefined;

const isExpired = (date) =>
	(date && !date.isValid()) ||
	(date && date.isValid() && date.valueOf() - Moment.utc().valueOf() <= 0);
