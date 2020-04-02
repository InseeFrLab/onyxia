import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paper, Button, Icon, Fab } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Ligne from 'js/components/commons/files';
import Toolbar from './toolbar.component';
import Progress from 'js/components/commons/progress';
import { getMinioDirectoryName } from 'js/minio-client';
import {
	createPolicyWithDirectory,
	createPolicyWithoutDirectory,
	initBucketPolicy,
	getBucketPolicy,
	setBucketPolicy,
} from 'js/minio-client';
import MyPolicy from './../my-policy.component';
import './my-files.scss';

class MyFiles extends React.Component {
	unmount = false;
	state = {
		directoryPath: '',
		precPath: undefined,
		files: undefined,
		filePath: undefined,
		uploadSeq: false,
		checkedFiles: {},
		sizeTotal: 0,
		sizeCurrent: 0,
		//
		policy: undefined,
		isInPublicDirectory: false,
		isPublicDirectory: false,
	};
	input = React.createRef();
	stream = null;

	constructor(props) {
		super(props);
		this.state.precPath = props.path;
		this.checkFolderStatus();
	}

	static getDerivedStateFromProps({ files, path, ...props }, state) {
		const checkedFiles = files.reduce(
			(a, { name }) => ({ ...a, [name]: state.checkedFiles[name] || false }),
			{}
		);
		return { ...state, checkedFiles };
	}

	componentDidUpdate = async () => {
		if (this.state.precPath !== this.props.path) {
			this.setState({ precPath: this.props.path });
			await this.checkFolderStatus();
		}
	};

	handleChangeDirectory = (e) =>
		this.setState({ directoryPath: e.target.value });

	handleCheck = (name) => (e) =>
		this.setState({
			checkedFiles: { ...this.state.checkedFiles, [name]: e.target.checked },
		});

	checkedAllFiles = (e) =>
		this.setState({
			checkedFiles: Object.keys(this.state.checkedFiles).reduce(
				(a, k) => ({ ...a, [k]: e.target.checked }),
				{}
			),
		});

	deleteFiles = () => {
		const checked = Object.entries(this.state.checkedFiles).reduce(
			(a, [name, etat]) => (etat ? [...a, name] : a),
			[]
		);
		if (checked.length > 0) {
			const promises = checked.map(
				(name) =>
					new Promise((resolve, reject) => {
						this.props
							.removeObjectFromBucket({
								objectName: name,
								bucketName: this.props.bucketName,
							})
							.then((result) => resolve(result))
							.catch((err) => reject(err));
					})
			);

			Promise.all(promises).then(() => {
				this.props.refresh();
			});
		}
	};

	handleChangeFile = (e) =>
		this.setState({
			files: Object.values(e.target.files),
			filePath: e.target.value,
		});

	stopStream = () => {
		if (this.stream && this.stream.destroy) {
			this.stream.destroy();
			this.props.consumeDownloadedFile();
			this.setState({ uploadSeq: false });
		}
	};

	upload = () => {
		const { files } = this.state;
		const { bucketName, uploadFileToBucket, path } = this.props;
		this.setState({
			uploadSeq: true,
			sizeTotal: files.reduce((a, { size }) => a + size, 0),
			sizeCurrent: 0,
		});

		const promises = files.map(
			(file) =>
				new Promise((resolve, reject) =>
					uploadFileToBucket({
						path:
							path[path.length - 1] === '/' ? path.slice(1, -1) : path.slice(1),
						file,
						bucketName: bucketName,
						notify: this.notifyUpload,
					})
						.then((result) => resolve(file))
						.catch((err) => reject(file))
				)
		);

		Promise.all(promises).then(() => {
			this.setState({
				files: undefined,
				filePath: undefined,
				uploadSeq: false,
			});
			this.props.refresh();
		});
	};

	createDirectory = () => {
		const file = new Blob(['Test,Text'], { type: 'text/csv' });
		file.name = '.keep';
		const path =
			this.props.path.slice(1).length > 0 ? `${this.props.path.slice(1)}/` : '';
		const { directoryPath } = this.state;

		const completePath = `${path}${directoryPath}`;
		this.props
			.uploadFileToBucket({
				path: completePath,
				file,
				bucketName: this.props.bucketName,
				notify: () => null,
			})
			.then((result) => {
				this.props.refresh();
				this.setState({ directoryPath: '' });
			})
			.catch((err) => {});
	};

	notifyUpload = (msg, params) => {
		if (msg === 'data') {
			const { size, stream } = params;
			this.stream = stream;
			this.setState({ sizeCurrent: this.state.sizeCurrent + size });
		} else if (msg === 'end') {
			this.stream = null;
		}
	};

	componentWillUnmount() {
		this.unmount = true;
	}
	/*
	 *
	 */

	checkFolderStatus = () => {
		const fetchStatus = async () => {
			this.props.startWaiting();
			const { bucketName, path } = this.props;
			try {
				const subDirectories = getSubDirectories(bucketName)(path);
				subDirectories.pop();
				const minioPath = `${getMinioPath(bucketName)(path)}*`;
				const policy = await fetchPolicy(bucketName);
				if (!this.unmount) {
					if (policy) {
						const { Resource } = policy;
						const isInPublicDirectory = subDirectories.reduce(
							(a, path) => Resource.indexOf(path) !== -1 || a,
							false
						);
						const isPublicDirectory = policy.Resource.indexOf(minioPath) !== -1;
						this.setState({
							policy,
							isInPublicDirectory,
							isPublicDirectory,
						});
					} else {
						this.setState({
							policy: undefined,
							isInPublicDirectory: false,
							isPublicDirectory: false,
						});
					}
				}
			} catch ({ code, name, ...rest }) {
				console.debug('debug', { code, name, ...rest });
				if (code === 'NoSuchBucketPolicy') {
					await initBucketPolicy(bucketName);
					await this.checkFolderStatus();
				}
			}

			this.props.stopWaiting();
		};

		if (!this.unmount) fetchStatus();
	};

	unlockDirectory = async () => {
		this.props.startWaiting();
		const { bucketName, path } = this.props;
		try {
			const minioPath = getMinioPath(bucketName)(path);
			const policy = await createPolicyWithDirectory(bucketName)(
				`${minioPath}*`
			);
			await setBucketPolicy({ bucketName, policy });
			await this.checkFolderStatus();
		} catch (e) {
			// TODO
		}
		return false;
	};

	lockDirectory = async () => {
		this.props.startWaiting();
		const { bucketName, path } = this.props;
		try {
			const minioPath = getMinioPath(bucketName)(path);
			const policy = await createPolicyWithoutDirectory(bucketName)(
				`${minioPath}*`
			);
			await setBucketPolicy({ bucketName, policy });
			await this.checkFolderStatus();
		} catch (e) {
			// TODO
		}
		return false;
	};

	deletePublicDirectory = async (minioPath) => {
		this.props.startWaiting();
		const { bucketName } = this.props;
		try {
			const policy = await createPolicyWithoutDirectory(bucketName)(minioPath);
			await setBucketPolicy({ bucketName, policy });
			await this.checkFolderStatus();
		} catch (e) {
			// TODO
		}

		return false;
	};

	render() {
		const { files, directories, bucketName, path } = this.props;
		const { isPublicDirectory, isInPublicDirectory, policy } = this.state;

		const paths = path
			.split('/')
			.filter((f) => f.length > 0)
			.reduce(
				(a, f) =>
					a.length === 0
						? [{ label: f, path: `/${f}/` }]
						: [...a, { label: f, path: `${a[a.length - 1].path}${f}/` }],
				[]
			);
		return (
			<>
				<div className="en-tete">
					<Typography
						variant="h2"
						align="center"
						color="textPrimary"
						gutterBottom
					>
						{`Parcourez votre dépôt ${bucketName}`}
					</Typography>
				</div>
				<FilDAriane fil={fil.myFiles(bucketName)(paths)} />
				<div className="contenu my-files">
					<Toolbar
						isInPublicDirectory={isInPublicDirectory}
						isPublicDirectory={isPublicDirectory}
						deleteFiles={this.deleteFiles}
						lockDirectory={this.lockDirectory}
						unlockDirectory={this.unlockDirectory}
					/>
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" gutterBottom>
							{`${bucketName}${path}`}
						</Typography>
						<div className="liens">
							{files.length > 1 ? (
								<div className="entry">
									<Checkbox
										className="select-it"
										onChange={this.checkedAllFiles}
									/>
								</div>
							) : null}
							{directories.length === 0 && files.length === 0 ? (
								<Typography variant="body1" gutterBottom>
									Cet espace est vide ou en cours de chargement.
								</Typography>
							) : null}
							{directories.map((d, i) => (
								<Ligne
									key={i}
									path={getPath(bucketName)(d.prefix)}
									icone="folder"
									name={getName(d.prefix)}
								/>
							))}
							{files.map(({ name }, i) => (
								<Ligne
									key={i}
									path={getPath(bucketName)(name)}
									icone="description"
									name={getName(name)}
									color="primary"
									checked={this.state.checkedFiles[name]}
									handleCheck={this.handleCheck(name)}
								/>
							))}
						</div>
					</Paper>
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" gutterBottom>
							Uploader un fichier dans le répertoire courant
						</Typography>
						<File files={this.state.files} />
						<input
							aria-hidden="true"
							type="file"
							multiple={true}
							style={{ display: 'none' }}
							ref={this.input}
							onChange={this.handleChangeFile}
						/>

						<Button
							variant="contained"
							color="primary"
							onClick={() => this.input.current.click()}
						>
							Choisissez un ou plusieurs fichiers
						</Button>
						{this.state.files ? (
							<div className="upload-button">
								<Fab color="primary" onClick={this.upload}>
									<Icon className="icone-bouton">cloud_upload</Icon>
								</Fab>
							</div>
						) : null}
					</Paper>
					<Paper className="paragraphe" elevation={1}>
						<Typography variant="h3" gutterBottom>
							Créer un Répertoire
						</Typography>
						<TextField
							label="Chemin du répertoire"
							value={this.state.directoryPath}
							onChange={this.handleChangeDirectory}
							margin="normal"
						/>
						<Button
							disabled={!isValidePath(this.state.directoryPath)}
							variant="contained"
							color="primary"
							onClick={this.createDirectory}
						>
							Créer un répertoire.
						</Button>
						<Typography variant="body2" gutterBottom>
							Le nom doit commencer par un caractère ou un chiffre. Pour
							détruire ce répertoire, il suffit de supprimer tout ce qu'il
							contient.
						</Typography>
					</Paper>
					<MyPolicy
						handleDelete={this.deletePublicDirectory}
						policy={policy}
						path={path}
					/>
				</div>
				<Progress
					display={this.state.uploadSeq}
					handleClose={this.stopStream}
					percent={
						(this.state.sizeCurrent / (this.state.sizeTotal + 0.01)) * 100
					}
				/>
			</>
		);
	}
}

MyFiles.propTypes = {
	loadBucketContent: PropTypes.func.isRequired,
};

const File = ({ files }) =>
	files ? (
		files.map((file, i) => (
			<div key={i} className="dialogue-upload">
				<span> {`nom : ${file.name}`}</span>
				<span> {`taille : ${file.size}ko`}</span>
			</div>
		))
	) : (
		<div>vous n&rsquo;avez pas choisi de fichier</div>
	);

const isValidePath = (path) =>
	path && path.trim().length > 0
		? path.toLowerCase().match(/^[a-z0-9]/i)
		: false;

export default MyFiles;

const getPath = (bucketName) => (path) =>
	path.startsWith('/')
		? `/mes-fichiers/${bucketName}${path}`
		: `/mes-fichiers/${bucketName}/${path}`;

const getName = (name) =>
	name
		.split('/')
		.filter((f) => f.length > 0)
		.reduce((a, v) => v);

/* 
    outils de gestion pour les policies sur répertoire.

*/

const getMinioPath = (bucketName) => (path) =>
	getMinioDirectoryName(bucketName)(path.trim().length === 0 ? '/' : path);

const getSubDirectories = (bucketName) => (directory) => {
	const tokens = directory.split('/').filter((p) => p.trim('').length !== 0);

	if (tokens.length === 0) return [];

	const tmp = ['', ...tokens].reduce(
		(a, subpath) => ({
			current: `${a.current}${subpath}/`,
			stack: [
				...a.stack,
				getMinioDirectoryName(bucketName)(`${a.current}${subpath}/*`),
			],
		}),
		{ current: '', stack: [] }
	);
	const { stack } = tmp;
	return stack;
};

const fetchPolicy = async (bucketName) => {
	const policyString = await getBucketPolicy(bucketName);

	const {
		Statement: [policy],
	} = JSON.parse(policyString);

	return policy;
};
