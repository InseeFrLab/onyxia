import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconButton, Badge } from '@material-ui/core/';
import { Avatar } from '@material-ui/core';
import Pile from 'js/components/commons/pile';
import { groupeType } from 'js/components/commons/prop-types';
import { CarteService } from 'js/components/commons/service-liste';
import { extractServiceId } from 'js/utils/service-utils';

/*
 * carte des apps des pages mon labo.
 */

class CarteMonGroupe extends React.Component {
	state = { raised: false, redirect: false, wait: false };
	componentDidMount() {
		this.props.groupe.apps.forEach((service) =>
			this.props.suivreStatutService(service)
		);
	}

	render() {
		const { groupe } = this.props;
		const running = isOneRunning(groupe);
		return (
			<CarteService
				id={groupe.id}
				wait={this.state.wait}
				pause={!running}
				title={getTitle(groupe)}
				subtitle="Groupe d'applications"
				avatar={getAvatar(groupe)}
				actions={getActions(groupe)}
				contenu={getContenu(groupe)(running)}
			/>
		);
	}
}

const getTitle = (groupe) =>
	groupe.apps.length > 0 ? groupe.apps[0].labels.ONYXIA_TITLE : 'Groupe vide';

const getAvatar = (groupe) => (
	<Avatar>
		<Icon>folder</Icon>
	</Avatar>
);

const getActions = (groupe) => () => (
	<Link to={`/my-lab/mes-services/${extractServiceId(groupe.id)}`}>
		<IconButton color="secondary" aria-label="plus de détails">
			<Icon>subdirectory_arrow_right</Icon>
		</IconButton>
	</Link>
);

const getContenu = (groupe) => (running) => () => {
	if (!running) return null;
	const max = 5;
	const cpu = Math.ceil(compterCpu(groupe.apps)(max));
	const ram = Math.ceil(compterRam(groupe.apps)(max));
	return (
		<div className="paragraphe">
			<div className="titre">Consommations</div>
			<span className="pile">
				<Pile small size={cpu} sizeMax={max} label={getLabel('cpu')(cpu * 2)} />
			</span>
			<span className="pile">
				<Pile small size={ram} sizeMax={max} label={getLabel('mem')(ram * 2)} />
			</span>
		</div>
	);
};

const isOneRunning = (groupe) =>
	groupe.apps.reduce(
		(a, { instances, tasksRunning }) => a || instances > 0,
		false
	) || groupe.groups.reduce((a, g) => a || isOneRunning(g), false);

const compterCpu = (services) => (max) =>
	Math.min(
		max,
		services.reduce((a, c) => a + (c.cpus * 10) / services.length, 0)
	);

const compterRam = (services) => (max) =>
	Math.min(
		max,
		services.reduce((a, c) => a + c.mem / 2048 / services.length, 0)
	);

const getLabel = (label) => (how) => () => (
	<span className="pile-label">
		<Badge badgeContent={how} color="primary" classes={{ badge: 'badge' }}>
			<span className="titre-label">{label}</span>
		</Badge>
	</span>
);
CarteMonGroupe.propTypes = { groupe: groupeType };
export default CarteMonGroupe;
