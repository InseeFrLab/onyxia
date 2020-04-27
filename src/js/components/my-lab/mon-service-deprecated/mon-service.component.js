import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
	Typography,
	Icon,
	IconButton,
	Fab,
	TableCell,
	TableBody,
	Table,
	TableHead,
	TableRow,
} from '@material-ui/core/';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Confirm from './dialog-confirm.component';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import {
	extractCreateFil,
	formatUrl,
	extractServiceId,
	extractGroupId,
	createMyLabParentUrl,
	truncateWithEllipses,
} from 'js/utils';
import { serviceType } from 'js/components/commons/prop-types';
import { getServiceAvatar } from 'js/components/commons/service-card';
import CopyableField from 'js/components/commons/copyable-field';
import { ONYXIA_FAVICON } from 'js/components/commons/favicon';
import { PUSHER } from 'js/components/notifications';
import AppBar from '@material-ui/core/AppBar';
import Titre from 'js/components/commons/titre';
import {
	Sandbox,
	ServiceToolbar,
	TaskFailure,
	Description,
	FileViewer,
} from './parts';
import conf from 'js/configuration';
import './mon-service.scss';

const FilMonService = ({ service, taskId }) => {
	const fil = getFilAriane(service, taskId);
	return <FilDAriane fil={fil} />;
};

const getFilAriane = (service, taskId) => {
	const filService = extractCreateFil(service.id);
	const retour = [].concat(fil.mesServices, filService);
	if (taskId) {
		return retour.concat({
			pathname: '/my-services',
			component: <span>{truncateWithEllipses(taskId, 25)}</span>,
		});
	}
	return [].concat(fil.mesServices, filService);
};

const Header = ({ service }) => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			<span>{service.labels.ONYXIA_TITLE}</span>
			<span className="logo">{getServiceAvatar(service)}</span>
		</Typography>
	</div>
);

const compareObject = (first) => (second) =>
	Object.entries(first).reduce((a, [k, v]) => a || v !== second[k], false);

class MonService extends React.Component {
	state = {
		resetFields: false,
		confirm: false,
		initialEnv: {},
		initialConf: {},
		currentEnv: {},
		currentConf: {},
		confirmAction: () => null,
		activeTab: 0,
	};
	constructor(props) {
		super(props);
		this.state.confirmAction = this.handleSaveConfEnv;
		this.state.initialEnv = props.service.env
			? Object.entries(props.service.env).reduce(
					(a, [k, v]) => ({ ...a, [k]: v }),
					{}
			  )
			: {};

		const {
			cpus,
			instances,
			mem,
			id,
			labels: { ONYXIA_TITLE },
		} = props.service;
		this.state.initialConf = {
			serviceId: id,
			instances,
			cpus,
			mems: mem,
			friendlyName: ONYXIA_TITLE,
		};
		this.state.currentEnv = { ...this.state.initialEnv };
		this.state.currentConf = { ...this.state.initialConf };
	}

	isEditEnv = () => compareObject(this.state.initialEnv)(this.state.currentEnv);

	isEditConf = () =>
		compareObject(this.state.initialConf)(this.state.currentConf);

	handleDelete = () => {
		this.setState({ confirm: true });
		this.toggleConfirm('delete');
	};

	handleChangeConf = (name) => (value) =>
		this.setState({
			currentConf: { ...this.state.currentConf, [name]: value },
		});

	handleSaveConfEnv = () =>
		this.props
			.updateServiceProprietesConfEnv(
				this.state.currentConf,
				this.state.currentEnv
			)
			.then(() => {
				this.setState({
					initialConf: { ...this.state.currentConf },
					resetFields: !this.state.resetFields,
					confirm: false,
				});
				PUSHER.push(
					<p>
						Votre service est en cours de redémarage
						<Link to={createMyLabParentUrl(this.props.service.id)}>
							<IconButton aria-label="suivre" color="secondary">
								<Icon>open_in_new</Icon>
							</IconButton>
							.
						</Link>
					</p>
				);
			});

	refreshToken = () => {
		this.setState({
			confirm: true,
			confirmAction: () => {
				this.props.refreshMinioToken(this.props.service.id);
				this.setState({ confirm: false });
			},
		});
	};

	handleChangeEnv = (name) => (value) =>
		this.setState({ currentEnv: { ...this.state.currentEnv, [name]: value } });

	handleSauvegarder = () => {
		this.setState({ confirmAction: this.handleSaveConfEnv, confirm: true });
	};

	toggleConfirm = (type, service) => {
		if (type === 'delete') {
			this.setState({
				title: 'Suppression du service',
				body: 'Voulez-vous vraiment supprimer votre service ?',
				confirmAction: () => {
					this.props.requestDeleteMonService(this.props.service);
					this.props.history.push(
						`/my-lab/mes-services${extractGroupId(this.props.service.id)}`
					);
				},
			});
		}
		if (type === 'change-state') {
			this.setState({
				title: "Changer l'état du service",
				body: "Voulez-vous vraiment valider le changement d'état du service ?",
				confirmAction: () => {
					this.props.setFavicon(ONYXIA_FAVICON.wait);
					this.setState({ confirm: false });
					this.props
						.changerEtatService(
							service.id,
							service.instances === 0,
							service.mem,
							service.cpus
						)
						.then(() => {
							this.props.setFavicon(ONYXIA_FAVICON.ok);
						});
				},
			});
		}
	};

	changerEtatService = (service) => {
		this.setState({ confirm: true });
		this.toggleConfirm('change-state', service);
	};

	render() {
		const { service, wait, match } = this.props;
		const { params } = match;
		const { taskId } = params;
		const { tasks } = service;
		const { ONYXIA_INSTANCE_EDITABLE } = service.labels;
		const { activeTab } = this.state;
		const TAB_CONFIGURATION = 0;
		const TAB_TASKS = 1;
		const TAB_DEBUG = 2;
		return (
			<>
				<Header service={service} />
				<FilMonService service={service} taskId={taskId} />
				<div className="contenu mon-service">
					<ServiceToolbar
						service={service}
						wait={wait}
						refreshToken={this.refreshToken}
						handleDelete={this.handleDelete}
						changerEtatService={this.changerEtatService}
					/>
					<AppBar position="static">
						<Tabs
							aria-label="tabs"
							value={activeTab}
							onChange={(_, newValue) => this.setState({ activeTab: newValue })}
						>
							<Tab label="Configuration" />
							<Tab label="Tâches" />
							<Tab label="Debug" />
						</Tabs>
					</AppBar>
					{activeTab === TAB_TASKS ? (
						<>
							<Paper className="paragraphe" elevation={1}>
								<Typography variant="h3" gutterBottom>
									<Titre titre="Tasks" wait={wait} />
								</Typography>
								<Typography variant="body1" color="textPrimary" gutterBottom>
									{tasks.length} tâche(s) actuellement en cours
								</Typography>
								{tasks.map((item) => {
									//Todo, deal with multiple / no ports
									const url = item.host + ':' + item.ports;
									const formattedUrl = formatUrl(url);
									return (
										<div key={item.id}>
											<Link
												to={`/my-lab/mes-services/${extractServiceId(
													service.id
												)}/task/${item.id}`}
											>
												{formattedUrl} ({item.state})
											</Link>
										</div>
									);
								})}
							</Paper>
							<Sandbox
								serviceId={extractServiceId(service.id)}
								service={service}
								taskId={taskId}
							/>
							<FileViewer
								serviceId={extractServiceId(service.id)}
								service={service}
								taskId={taskId}
							/>
						</>
					) : (
						<></>
					)}
					{activeTab === TAB_DEBUG &&
					service.hasOwnProperty('lastTaskFailure') ? (
						<>
							<TaskFailure service={service} formatUrl={formatUrl} />
							<Sandbox
								serviceId={extractServiceId(service.id)}
								service={service}
								taskId={service.lastTaskFailure.taskId}
							/>
							<FileViewer
								serviceId={extractServiceId(service.id)}
								service={service}
								taskId={service.lastTaskFailure.taskId}
							/>
						</>
					) : null}
					{activeTab === TAB_CONFIGURATION ? (
						<Description
							service={service}
							wait={wait}
							getUrlFields={getUrlFields}
						/>
					) : null}

					{activeTab === TAB_CONFIGURATION ? (
						<Paper className="paragraphe" elevation={1}>
							<Typography variant="h3" gutterBottom>
								<Titre titre="Configuration du service" wait={wait} />
								<Sauvegarder
									display={this.isEditConf()}
									handleClick={this.toggleConfirm}
								/>
							</Typography>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Propriétés</TableCell>
										<TableCell>Valeur</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{ONYXIA_INSTANCE_EDITABLE ? (
										<TableRow>
											<TableCell>instances</TableCell>
											<TableCell>
												<CopyableField
													copy
													options={{
														step: 1,
														min: 1,
														max: conf.APP.MAX_INSTANCES || 100,
													}}
													value={this.state.initialConf.instances}
													type="number"
													reset={this.state.resetFields}
													onChange={
														wait
															? undefined
															: this.handleChangeConf('instances')
													}
												/>
											</TableCell>
										</TableRow>
									) : null}
									<TableRow>
										<TableCell>cpu</TableCell>
										<TableCell>
											<CopyableField
												copy
												options={{ step: 0.1, min: 0, max: 1 }}
												value={this.state.initialConf.cpus}
												type="number"
												reset={this.state.resetFields}
												onChange={
													wait ? undefined : this.handleChangeConf('cpus')
												}
											/>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>ram</TableCell>
										<TableCell>
											<CopyableField
												copy
												options={{ step: 128, min: 0, max: 12800 }}
												value={this.state.initialConf.mems}
												onChange={
													wait ? undefined : this.handleChangeConf('mems')
												}
												reset={this.state.resetFields}
												type="number"
											/>
										</TableCell>
									</TableRow>
									{this.state.initialConf.friendlyName && (
										<TableRow>
											<TableCell>friendly name</TableCell>
											<TableCell>
												<CopyableField
													copy
													value={this.state.initialConf.friendlyName}
													reset={this.state.resetFields}
													onChange={
														wait
															? undefined
															: this.handleChangeConf('friendlyName')
													}
												/>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</Paper>
					) : null}

					{activeTab === TAB_CONFIGURATION && service.env ? (
						<Paper className="paragraphe" elevation={1}>
							<Typography variant="h3" gutterBottom>
								<Titre
									titre="	Propriétes d&rsquo;environnement du service"
									wait={wait}
								/>
								<Sauvegarder
									display={this.isEditEnv()}
									handleClick={this.handleSauvegarder}
								/>
							</Typography>

							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Propriétés</TableCell>
										<TableCell>Valeur</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{Object.entries(service.env).map(([key, value], i) => (
										<TableRow key={i}>
											<TableCell>{key}</TableCell>
											<TableCell>
												<CopyableField
													copy
													value={this.state.initialEnv[key]}
													reset={this.state.resetFields}
													onChange={
														wait ? undefined : this.handleChangeEnv(key)
													}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Paper>
					) : null}
				</div>
				<Confirm
					open={this.state.confirm}
					toggle={() => {
						this.setState({ confirm: false });
					}}
					action={this.state.confirmAction}
					title={this.state.title}
					body={this.state.body}
				/>
			</>
		);
	}
}

MonService.propTypes = {
	service: serviceType.isRequired,
	wait: PropTypes.bool.isRequired,
	changerEtatService: PropTypes.func.isRequired,
	refreshMinioToken: PropTypes.func.isRequired,
	updateServiceProprietesConfEnv: PropTypes.func.isRequired,
	requestDeleteMonService: PropTypes.func.isRequired,
	setFavicon: PropTypes.func.isRequired,
};

const getUrlFields = (onyxiaUrl) =>
	onyxiaUrl
		.split(',')
		.map((url, i) => <CopyableField copy key={i} value={url} open />);

const Sauvegarder = ({ display, handleClick }) =>
	display ? (
		<Fab
			style={{ float: 'right' }}
			color="primary"
			mini="true"
			aria-label="sauvegarder"
			className="bouton"
			onClick={handleClick}
		>
			<Icon>save</Icon>
		</Fab>
	) : null;

export default MonService;
