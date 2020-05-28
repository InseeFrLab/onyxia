import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { axiosAuth } from 'js/utils';
import api from 'js/redux/api';
import { creerNouveauService, requestDeleteMonService } from 'js/redux/actions';
import { getMinioToken } from 'js/minio-client';
import { getVaultToken } from 'js/vault-client';
import {
	getOptions,
	getValuesObject,
} from 'js/components/my-lab/catalogue/catalogue-navigation/leaf/deploiement/nouveau-service';

interface cloudShellData {
	status?: string;
	packageToDeploy?: any;
	catalogId?: string;
	url?: string;
}

const CloudShell = () => {
	const user = useSelector((store) => store.user);
	const [cloudShellStatus, setCloudShellStatus] = useState<string | null>();
	const [url, setUrl] = useState<string | null>();
	const [height, setHeight] = useState(200);
	const [visibility, setVisibility] = useState(false);
	const [minioCredentials, setMinioCredentials] = useState<any>();
	const dispatch = useDispatch();

	const launchCloudShell = (user) => {
		axiosAuth.get<cloudShellData>(`${api.cloudShell}`).then((response) => {
			var cloudshell = (response as any) as cloudShellData;
			const catalogId = { catalogId: cloudshell.catalogId };
			const service = cloudshell.packageToDeploy;
			setCloudShellStatus(cloudshell.status);
			if (cloudshell.status === 'DOWN') {
				dispatch(
					creerNouveauService(
						{
							...service,
							...catalogId,
						},
						getValuesObject(getOptions(user, service, minioCredentials, {}).fV),
						false
					)
				).then((response) => {
					axiosAuth
						.get<cloudShellData>(`${api.cloudShell}`)
						.then((response: any) => {
							cloudshell = (response as any) as cloudShellData;
							setUrl(cloudshell.url);
							setCloudShellStatus(cloudshell.status);
						});
				});
			} else {
				if (cloudshell.status === 'UP') {
					setUrl(cloudshell.url);
				}
			}
		});
		return launchCloudShell;
	};

	const deleteCloudShell = (idep) => {
		dispatch(requestDeleteMonService({ id: 'cloudshell' }));
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
						if (
							(!cloudShellStatus || cloudShellStatus === 'DOWN')) {
							launchCloudShell(user);
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


	const CloudShellWindows = () => {
		return (<Resizable
			size={{
				height: height,
				width: '100%',
			}}
			onResizeStop={(e, direction, ref, d) => {
				setHeight(height + d.height);
			}}
		>
			<iframe
				title="Cloud shell"
				height={height}
				width="100%"
				src={url}
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
				.catch((e) => {
					setMinioCredentials({});
				});
		}
	}, [minioCredentials]);

	useEffect(() => {
		getVaultToken();
	}, [user]);





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
							document
								.getElementById('cloudshell-iframe')
								.parentNode.replaceChild(
									document.getElementById('cloudshell-iframe').cloneNode(),
									document.getElementById('cloudshell-iframe')
								)
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
							deleteCloudShell(user.IDEP);
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
				<CloudShellWindows />
			</div>
		</div>
	);

};

export default CloudShell;
