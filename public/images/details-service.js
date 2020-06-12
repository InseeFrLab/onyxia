import React from 'react';
import PropTypes from 'prop-types';
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Button,
	IconButton,
	Avatar,
} from '@material-ui/core';
import { Launch } from '@material-ui/icons';
import Pile from 'js/components/commons/pile';

class DetailsService extends React.Component {
	handleClose = () => {
		this.props.setServiceSelectionne(null);
	};

	handleClickService = (service) => {
		window.open(service.urls.split(',')[0]);
	};

	render() {
		const { serviceSelectionne: service } = this.props;
		const titre = service.labels
			? service.labels.ONYXIA_TITLE
			: service.apps.length === 0
			? 'Supprime moi'
			: service.apps[0].labels.ONYXIA_TITLE;
		const sousTitre = service.labels
			? service.labels.ONYXIA_SUBTITLE
			: service.apps.length === 0
			? service.id
			: service.apps[0].labels.ONYXIA_TITLE;
		return (
			<Dialog
				fullWidth
				fullScreen={false}
				open={true}
				onClose={this.handleClose}
				aria-labelledby="details-service-titre"
				classes={{
					root: 'accueil-modal',
					paper: 'container',
				}}
			>
				<DialogTitle classes={{ root: 'en-tete' }}>
					<Avatar
						src={service.labels.ONYXIA_LOGO}
						className="avatar"
						id="details-service-titre"
					/>
					<div className="titre">{titre}</div>
					<div className="sous-titre">{sousTitre}</div>
				</DialogTitle>
				<DialogContent classes={{ root: 'contenu' }}>
					<DialogContentText>
						<span className="paragraphe">
							<span className="titre">Description</span>
							<span className="corps">{service.labels.ONYXIA_DESCRIPTION}</span>
						</span>
						<span className="paragraphe">
							<span className="titre">Ressources réservées</span>
							<span className="corps">
								<span className="pile">
									<Pile size={service.cpus} sizeMax={5} label="cpu" />
								</span>
								<span className="pile">
									<Pile
										size={Math.round(service.mem / 1024)}
										sizeMax={8}
										label="ram"
										title={`${service.mem} Mo`}
									/>
								</span>
								<span className="pile">
									<Pile
										size={service.disk}
										sizeMax={5}
										label="disque"
										title={`${service.disk} Go`}
									/>
								</span>
							</span>
						</span>

						<span className="paragraphe">
							<span className="corps">
								Vous pouvez consulter le service
								<IconButton
									color="secondary"
									component="span"
									onClick={() => this.handleClickService(service)}
								>
									<Launch />
								</IconButton>
								{service.labels.ONYXIA_CHANNEL ? (
									<span>
										{' '}
										et le canal de Chat
										<IconButton
											color="secondary"
											component="span"
											onClick={() => window.open(service.labels.ONYXIA_CHANNEL)}
										>
											<Icon>group</Icon>
										</IconButton>
									</span>
								) : null}
							</span>
						</span>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleClose} color="primary" autoFocus>
						Fermer
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}
DetailsService.propTypes = {
	serviceSelectionne: PropTypes.shape({}).isRequired,
	setServiceSelectionne: PropTypes.func.isRequired,
};
export default DetailsService;
