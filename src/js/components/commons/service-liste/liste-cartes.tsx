import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Grid, Icon, Typography, Fab } from '@material-ui/core/';
import Paper from '@material-ui/core/Paper';
import {
	CarteMonService,
	CarteMonGroupe,
} from 'js/components/commons/service-liste';
import { typeRequest as TYPE_REQUEST, extractGroupId } from 'js/utils';
import * as TYPE from 'js/components/commons/prop-types';
import Alert from 'js/components/commons/alert';
import Confirm from 'js/components/commons/confirm';
import { WarnIcon } from 'js/components/commons/icons';
import D from 'js/i18n';
import { Service, Group } from 'js/model';

interface MyProps {
	initialiser?: () => void;
	services?: Service[];
	changerEtatService?: (
		id: string,
		state: boolean,
		cpus: number,
		mem: number
	) => void;
	requestDeleteMonService?: (service) => void;
	refresh?: () => void;
	supprimerGroupe?: (id: string) => void;
	groupe?: Group;
	mesServicesWaiting?: string[];
	suivreStatutService?: () => void;
	groupes?: Group[];
}

interface MyState {
	confirmPauseAll: boolean;
	confirmDeleteAll: boolean;
}

class ListeCartes extends React.Component<MyProps, MyState> {
	static propTypes = {
		mesServicesWaiting: PropTypes.arrayOf(PropTypes.string).isRequired,
		typeRequest: PropTypes.oneOf([null, ...Object.values(TYPE_REQUEST)]),
		suivreStatutService: PropTypes.func.isRequired,
		initialiser: PropTypes.func.isRequired,
		supprimerGroupe: PropTypes.func,
		refresh: PropTypes.func.isRequired,
		groupes: TYPE.groupesType,
		services: TYPE.servicesType,
	};

	state = { confirmPauseAll: false, confirmDeleteAll: false };
	constructor(props) {
		super(props);
		if (this.props.initialiser) {
			this.props.initialiser();
		}
	}

	toggleConfirmPauseAll = () =>
		this.setState({ confirmPauseAll: !this.state.confirmPauseAll });

	handlePauseAll = () => {
		this.setState({ confirmPauseAll: false });
		this.props.services.forEach((s) => {
			if (s.instances) {
				this.props.changerEtatService(s.id, false, s.mem, s.cpus);
			}
		});
	};

	toggleConfirmDeleteAll = () =>
		this.setState({ confirmDeleteAll: !this.state.confirmDeleteAll });

	handleDeleteAll = () => {
		this.setState({ confirmDeleteAll: false });
		this.props.services.forEach((s) => {
			if (s.instances) {
				this.props.requestDeleteMonService(s);
			}
		});
	};

	handleDemarrerService = (s) =>
		this.props.changerEtatService(s.id, true, s.mem, s.cpus);

	handleRefresh = () => this.props.refresh();

	handleSupprimerGroupe = () => {
		if (this.props.supprimerGroupe)
			this.props.supprimerGroupe(this.props.groupe.id);
		return false;
	};

	render() {
		const {
			services,
			mesServicesWaiting,
			suivreStatutService,
			groupes,
			groupe,
		} = this.props;
		const hasService = !(services.length === 0 && groupes.length === 0);
		return (
			<>
				<Confirm
					titre="Arrêter toute vos applications"
					display={this.state.confirmPauseAll}
					cancel={this.toggleConfirmPauseAll}
					confirm={this.handlePauseAll}
				>
					<div className="confirm-pause-all">
						<span className="warning">
							<WarnIcon width={80} height={80} />
						</span>
						<Typography variant="body1" gutterBottom>
							Vous vous apprêtez à stopper tous vos services actuellement en
							activité et à supprimer toutes les données qui leurs sont associés
							!
						</Typography>
					</div>
				</Confirm>

				<Confirm
					titre="Delete all your services"
					display={this.state.confirmDeleteAll}
					cancel={this.toggleConfirmDeleteAll}
					confirm={this.handleDeleteAll}
				>
					<div className="confirm-delete-all">
						<span className="warning">
							<WarnIcon width={80} height={80} />
						</span>
						<Typography variant="body1" gutterBottom>
							{D.deleteAllServices}
						</Typography>
					</div>
				</Confirm>

				<div className="contenu mes-services">
					<Toolbar
						groupe={groupe}
						hasService={hasService}
						handleDeleteAll={this.toggleConfirmDeleteAll}
						handlePauseAll={this.toggleConfirmPauseAll}
						handleRefresh={this.handleRefresh}
						handleSupprimerGroupe={this.handleSupprimerGroupe}
					/>
					{hasService ? (
						<Grid container spacing={8} classes={{ container: 'cartes' }}>
							{services.map((service, i) => (
								<CarteMonService
									key={i}
									wait={
										mesServicesWaiting &&
										mesServicesWaiting.indexOf(service.id) !== -1
									}
									service={service}
									handleClickLaunch={this.handleDemarrerService}
									suivreStatutService={suivreStatutService}
								/>
							))}
							{groupes.map((groupe, i) => (
								<CarteMonGroupe
									key={i}
									group={groupe}
									suivreStatutService={suivreStatutService}
								/>
							))}
						</Grid>
					) : (
						<Alert severity="warning" message={D.noService} />
					)}
				</div>
			</>
		);
	}
}

const Toolbar = ({
	groupe,
	hasService,
	handleDeleteAll,
	handlePauseAll,
	handleRefresh,
	handleSupprimerGroupe,
}: {
	groupe: Group;
	hasService: Boolean;
	handleDeleteAll?: () => void;
	handlePauseAll: () => void;
	handleRefresh: () => void;
	handleSupprimerGroupe: () => void;
}) => (
	<Paper className="onyxia-toolbar" elevation={1}>
		<Actions
			groupId={groupe ? groupe.id : null}
			hasService={hasService}
			handleDeleteAll={handleDeleteAll}
			handlePauseAll={handlePauseAll}
			handleRefresh={handleRefresh}
			handleSupprimerGroupe={handleSupprimerGroupe}
		/>
	</Paper>
);

const Actions = ({
	hasService,
	handleDeleteAll,
	handlePauseAll,
	handleRefresh,
	handleSupprimerGroupe,
	groupId,
}) => (
	<>
		{hasService && (
			<>
				<Fab
					color="secondary"
					aria-label="deleteAll"
					classes={{ root: 'bouton' }}
					onClick={handleDeleteAll}
				>
					<Icon>deleteAll</Icon>
				</Fab>
				<Fab
					color="secondary"
					aria-label="pause"
					classes={{ root: 'bouton' }}
					onClick={handlePauseAll}
				>
					<Icon>pause</Icon>
				</Fab>
				<Fab
					color="secondary"
					aria-label="refresh"
					classes={{ root: 'bouton' }}
					onClick={handleRefresh}
				>
					<Icon>refresh</Icon>
				</Fab>
			</>
		)}
		<Link to="/my-lab/catalogue">
			<Fab color="secondary" aria-label="refresh" classes={{ root: 'bouton' }}>
				<Icon>add</Icon>
			</Fab>
		</Link>
		{groupId && hasService ? (
			<Link to={`/my-lab/mes-services${extractGroupId(groupId)}`}>
				<Fab
					color="secondary"
					aria-label="supprimer"
					classes={{ root: 'bouton' }}
					onClick={handleSupprimerGroupe}
				>
					<Icon>delete</Icon>
				</Fab>
			</Link>
		) : null}
	</>
);

export default ListeCartes;
