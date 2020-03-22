import React from 'react';
import { DialogTitle, Dialog, Icon } from '@material-ui/core';
import { DialogContent } from '@material-ui/core';
import { DialogActions, Button } from '@material-ui/core';
import { GrafanaIcon, RocketChatIcon } from 'js/components/commons/icons';
import { InputAdornment, IconButton, Input } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import Collapse from '@material-ui/core/Collapse';
import { getGrafanaServiceUrl } from 'js/utils';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import CopyableField from 'js/components/commons/copyable-field';
import {
	getServiceAvatar,
	getServiceTitle,
	getServiceSubtitle,
} from 'js/components/commons/service-liste';

class MesServiceModal extends React.Component {
	captureInputUrl = r => (this.inputRef = r);

	handleClickCopy = () => {
		if (this.inputRef) {
			this.inputRef.select();
			document.execCommand('copy');
		}
		return false;
	};

	handleLaunch = () => window.open(this.props.service.labels.ONYXIA_URL);

	render() {
		const {
			service,
			display,
			handleClose,
			changerEtatService,
			requestDeleteMonService,
		} = this.props;

		return service ? (
			<Dialog
				scroll="body"
				open={display}
				onClose={handleClose}
				aria-labelledby="simple-dialog-title"
				classes={{
					root: 'accueil-modal mes-service-modal',
					paper: 'container',
				}}
			>
				<DialogTitle classes={{ root: 'en-tete' }}>
					<span className="avatar">{getServiceAvatar(service)}</span>
					<div className="titre">{getServiceTitle(service)}</div>
					<div className="sous-titre">{getServiceSubtitle(service)}</div>
				</DialogTitle>
				<DialogContent classes={{ root: 'contenu' }}>
					<span className="paragraphe">
						<span className="titre">Consommations</span>
						<span className="corps">
							<Metrique label="cpu" valeur={service.cpus} />
							<Metrique label="ram" valeur={`${service.mem} Mo`} />
						</span>
					</span>
					<PropritesService service={service} />
					<span className="paragraphe">
						<span className="titre">Accéder à votre service</span>
						<span className="corps">
							{service.labels.ONYXIA_URL ? (
								<InputUrl
									url={service.labels.ONYXIA_URL}
									label="accédez à votre votre service"
									copy
									launch
								/>
							) : null}
							{service.labels.ONYXIA_PRIVATE_ENDPOINT ? (
								<InputUrl
									url={service.labels.ONYXIA_PRIVATE_ENDPOINT}
									copy
									label="l'url de votre service"
								/>
							) : null}
						</span>
					</span>
					<span className="paragraphe">
						Consulter les statistiques de votre service
						<IconButton
							color="secondary"
							component="span"
							onClick={() => window.open(getGrafanaServiceUrl(service))}
						>
							<GrafanaIcon />
						</IconButton>
						{service.labels.ONYXIA_CHANNEL ? (
							<span>
								et le canal RocketChat
								<IconButton
									color="secondary"
									component="span"
									onClick={() => window.open(service.labels.ONYXIA_CHANNEL)}
								>
									<RocketChatIcon />
								</IconButton>
							</span>
						) : null}
					</span>
				</DialogContent>

				<DialogActions>
					<Button
						variant="fab"
						aria-label="supprimer"
						color="secondary"
						onClick={() => {
							requestDeleteMonService(service);
							// cardStartWaiting(service.id);
							handleClose();
						}}
					>
						<Icon>delete</Icon>
					</Button>
					<Button
						variant="fab"
						color={service.instances ? 'secondary' : 'primary'}
						aria-label={service.instances ? 'pause' : 'démarrer'}
						className="{classes.button}"
						onClick={() => {
							changerEtatService(
								service.id,
								service.instances === 0,
								service.mem,
								service.cpus
							);
							handleClose();
						}}
					>
						<Icon>{service.instances ? 'pause' : 'play_arrow'}</Icon>
					</Button>
					<Button
						variant="fab"
						aria-label="Grafana"
						color="primary"
						onClick={() => null}
					>
						<Icon>edit</Icon>
					</Button>
					<Button
						variant="fab"
						aria-label="fermer"
						color="primary"
						onClick={handleClose}
					>
						<Icon>clear</Icon>
					</Button>
				</DialogActions>
			</Dialog>
		) : null;
	}
}

class PropritesService extends React.Component {
	state = { expanded: false };
	handleClick = () => {
		this.setState({ expanded: !this.state.expanded });
	};
	render() {
		const {
			service: { env },
		} = this.props;
		if (!env) return null;
		return (
			<span className="paragraphe">
				<span className="titre collapse">
					Propriétés du service
					<IconButton className="bouton" onClick={this.handleClick}>
						<Icon>
							{this.state.expanded
								? 'keyboard_arrow_right'
								: 'keyboard_arrow_down'}
						</Icon>
					</IconButton>
				</span>
				<Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
					<span className="corps">
						<Table className="{classes.table}">
							<TableHead>
								<TableRow>
									<TableCell>Propriétés</TableCell>
									<TableCell>Valeur</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Object.entries(env).map(([key, value], i) => (
									<TableRow key={i}>
										<TableCell>{key}</TableCell>
										<TableCell>
											<CopyableField value={value} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</span>
				</Collapse>
			</span>
		);
	}
}

const Metrique = ({ label, valeur }) => (
	<span className="metrique">
		<span className="label">{label} : </span>
		<span className="valeur">{valeur}</span>
	</span>
);

class InputUrl extends React.Component {
	domInput = null;

	open = () => window.open(this.props.url);

	copy = () => {
		if (this.domInput) {
			this.domInput.select();
			document.execCommand('copy');
		}
		return false;
	};

	render() {
		const { url, launch, copy, label } = this.props;
		return (
			<React.Fragment>
				<Input
					inputRef={r => {
						this.domInput = r;
					}}
					label={label}
					variant="outlined"
					fullWidth
					value={url}
					endAdornment={
						<InputAdornment position="end">
							{copy ? (
								<IconButton
									aria-label="copier dans le presse papier"
									onClick={this.copy}
								>
									<Icon>file_copy</Icon>
								</IconButton>
							) : null}
							{launch ? (
								<IconButton aria-label="aller au service" onClick={this.open}>
									<Icon>launch</Icon>
								</IconButton>
							) : null}
						</InputAdornment>
					}
				/>
				{label ? <InputLabel>{label}</InputLabel> : null}
			</React.Fragment>
		);
	}
}

export default MesServiceModal;
