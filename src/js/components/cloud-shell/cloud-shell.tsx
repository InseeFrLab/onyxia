import React, { useState, useEffect } from 'react';
import { useDispatch, useMustacheParams, useAppConstants } from "app/lib/hooks";
import { Resizable } from 're-resizable';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Autorenew from '@material-ui/icons/Autorenew';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import LoopSharpIcon from '@material-ui/icons/LoopSharp';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import DeleteIcon from '@material-ui/icons/Delete';
import './cloud-shell.scss';
import { withStyles } from '@material-ui/core';
import { restApiPaths } from "js/restApiPaths";
import { actions as myLabActions } from "js/redux/myLab";
import { getMinioToken } from "js/minio-client/minio-client";
import {
	getOptions,
	getValuesObject,
} from 'js/components/my-lab/catalogue/catalogue-navigation/leaf/deploiement/nouveau-service';
import { prAxiosInstance } from "lib/setup";
interface CloudShellData {
	status?: string;
	packageToDeploy?: any;
	catalogId?: string;
	url?: string;
}

const CloudShell = () => {

	const { userProfile: { idep } } = useAppConstants({ "assertIsUserLoggedInIs": true });
	const [cloudShellStatus, setCloudShellStatus] = useState<string | null>();
	const [url, setUrl] = useState<string | null>();
	const [height, setHeight] = useState(200);
	const [visibility, setVisibility] = useState(false);
	const [minioCredentials, setMinioCredentials] = useState<any>();
	const [reloadCloudshell, setReloadCloudShell] = useState(0);
	const dispatch = useDispatch();


	const { mustacheParams } = useMustacheParams();

	const launchCloudShell = async () => {

		const axiosAuth = await prAxiosInstance;

		axiosAuth.get<CloudShellData>(`${restApiPaths.cloudShell}`)
			.then(({ data }) => data)
			.then(cloudShell => {
				const catalogId = { catalogId: cloudShell.catalogId };
				const service = cloudShell.packageToDeploy;
				setCloudShellStatus(cloudShell.status);
				if (cloudShell.status === 'DOWN') {
					(dispatch(
						myLabActions.creerNouveauService({
							"service": {
								...service,
								...catalogId,
							},
							"options": getValuesObject(
								getOptions(
									{ ...mustacheParams, "s3": mustacheParams.s3! },
									service,
									{}
								).fV
							) as any,
							"dryRun": false
						})
					) as any).then(() => {
						axiosAuth
							.get<CloudShellData>(restApiPaths.cloudShell)
							.then(({data})=> data)
							.then(cloudShell => {
								setUrl(cloudShell.url);
								setCloudShellStatus(cloudShell.status);
							});
					});
				} else {
					if (cloudShell.status === 'UP') {
						setUrl(cloudShell.url);
					}
				}
			});
	};

	const deleteCloudShell = () => {
		dispatch(myLabActions.requestDeleteMonService(
			{ "service": { id: 'cloudshell' } })
		);
		setCloudShellStatus(undefined);
		setUrl(undefined);
	};

	const CloudShellIconButton = withStyles({
		root: {
			color: 'white',
		},
	})(IconButton);

	const Button = () => {
		return (
			cloudShellStatus && cloudShellStatus === 'DOWN' ? (
				<LoopSharpIcon className="loading" />
			) : (
					<KeyboardIcon />
				))
	}

	const CloudShellStartButton = () => {
		return (
			<div style={{ position: 'fixed', bottom: 0, zIndex: 999 }}>
				<IconButton
					aria-label="maximize"
					onClick={() => {
						if ((!cloudShellStatus || cloudShellStatus === 'DOWN')) {
							launchCloudShell();
						}
						setVisibility(true);
					}}
					className="maximize-shell"
				>
					<Button />
				</IconButton>
			</div>
		);
	};


	const CloudShellWindow = () => {
		return (<Resizable
			size={{
				height: height,
				width: '100%',
			}}
			onResizeStop={(...[, , , d]) => {
				setHeight(height + d.height);
			}}
		>
			<iframe
				key={reloadCloudshell}
				title="Cloud shell"
				height={height}
				width="100%"
				src={url!}
				id="cloudshell-iframe"
			></iframe>
		</Resizable>
		);
	}

	useEffect(() => {
		if (!minioCredentials) {
			getMinioToken()
				.then((credentials) => {
					setMinioCredentials(credentials);
				})
				.catch(() => {
					setMinioCredentials({});
				});
		}
	}, [minioCredentials]);

	if (!visibility || cloudShellStatus === 'DOWN') {
		return <CloudShellStartButton />;
	}


	return (
		<div>
			<div style={{ position: 'fixed', bottom: 0, zIndex: 999, width: '100%' }}>
				<div
					style={{
						width: 'fit-content',
						borderTopRightRadius: '10px',
						backgroundColor: 'rgba(0, 0, 0, 0.35)',
					}}
				>
					<CloudShellIconButton
						aria-label="autorenew"
						onClick={() =>
							setReloadCloudShell(reloadCloudshell + 1)
						}
						className="renew-shell"
					>
						<Autorenew />
					</CloudShellIconButton>

					<CloudShellIconButton
						aria-label="openinnewicon"
						onClick={() => {
							const cloudshell = document.getElementById(
								'cloudshell-iframe'
							) as HTMLImageElement;
							window.open(String(cloudshell.src), '_blank');
							setVisibility(false);
						}}
						className="opennewtab-shell"
					>
						<OpenInNewIcon />
					</CloudShellIconButton>

					<CloudShellIconButton
						aria-label="delete"
						onClick={() => {
							setVisibility(false);
							(deleteCloudShell as any)(idep);
						}}
						className="close-shell"
					>
						<DeleteIcon />
					</CloudShellIconButton>

					<CloudShellIconButton
						aria-label="close"
						onClick={() => setVisibility(false)}
						className="close-shell"
					>
						<CloseIcon />
					</CloudShellIconButton>
				</div>
				<CloudShellWindow />
			</div>
		</div>
	);

};

export default CloudShell;
