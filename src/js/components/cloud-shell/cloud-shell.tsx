import { useState, useEffect, memo } from 'react';
import { useDispatch, useMustacheParams, useAppConstants } from "app/interfaceWithLib/hooks";
import { Resizable } from "re-resizable";
import type { ResizableProps } from "re-resizable";
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Autorenew from '@material-ui/icons/Autorenew';
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
import { createUseGlobalState } from "powerhooks";
import { prAxiosInstance } from "lib/setup";
import { useConstCallback } from "powerhooks";

export const { useIsCloudShellVisible } = createUseGlobalState(
	"isCloudShellVisible",
	() => false,
	{ "persistance": false }
);
interface CloudShellData {
	status?: "UP" | "DOWN" | undefined;
	packageToDeploy?: any;
	catalogId?: string;
	url?: string;
}

export const CloudShell = memo(() => {

	const { parsedJwt: { preferred_username } } = useAppConstants({ "assertIsUserLoggedInIs": true });
	const [cloudShellStatus, setCloudShellStatus] = useState<"UP" | "DOWN" | undefined>(undefined);
	const [url, setUrl] = useState<string | undefined>(undefined);
	const { isCloudShellVisible, setIsCloudShellVisible}= useIsCloudShellVisible();
	const [minioCredentials, setMinioCredentials] = useState<any>();
	const [reloadCloudshell, setReloadCloudShell] = useState(0);
	const dispatch = useDispatch();


	const { mustacheParams } = useMustacheParams();


	const launchCloudShell = useConstCallback(async () => {

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
							.then(({ data }) => data)
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
	});

	const deleteCloudShell = useConstCallback(() => {
		dispatch(myLabActions.requestDeleteMonService(
			{ "service": { id: 'cloudshell' } })
		);
		setCloudShellStatus(undefined);
		setUrl(undefined);
	});




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

	useEffect(
		() => {

			if (
				!isCloudShellVisible ||
				cloudShellStatus === "UP"
			) {
				return;
			}

			launchCloudShell();

		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isCloudShellVisible]
	);

	if (!isCloudShellVisible || cloudShellStatus === "DOWN") {
		return null;
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
							setIsCloudShellVisible(false);
						}}
						className="opennewtab-shell"
					>
						<OpenInNewIcon />
					</CloudShellIconButton>

					<CloudShellIconButton
						aria-label="delete"
						onClick={() => {
							setIsCloudShellVisible(false);
							(deleteCloudShell as any)(preferred_username);
						}}
						className="close-shell"
					>
						<DeleteIcon />
					</CloudShellIconButton>

					<CloudShellIconButton
						aria-label="close"
						onClick={() => setIsCloudShellVisible(false)}
						className="close-shell"
					>
						<CloseIcon />
					</CloudShellIconButton>
				</div>
				<CloudShellWindow
					reloadCloudshell={reloadCloudshell}
					src={url!}
				/>
			</div>
		</div>
	);

});


const CloudShellIconButton = withStyles({
	"root": {
		"color": 'white',
	},
})(IconButton);



const { CloudShellWindow } = (() => {

	type Props = {
		reloadCloudshell: number;
		src: string;

	};

	const CloudShellWindow = memo((props: Props) => {

		const { reloadCloudshell, src } = props;

		const [height, setHeight] = useState(200);

		const onResizeStop = useConstCallback(
			(...[, , , d]: Parameters<NonNullable<ResizableProps["onResizeStop"]>>) =>
				setHeight(height + d.height)
		);

		return (
			<Resizable
				size={{
					height: height,
					width: '100%',
				}}
				onResizeStop={onResizeStop}
			>
				<iframe
					key={reloadCloudshell}
					title="Cloud shell"
					height={height}
					width="100%"
					src={src}
					id="cloudshell-iframe"
				></iframe>
			</Resizable>
		);
	});

	return { CloudShellWindow };

})();
