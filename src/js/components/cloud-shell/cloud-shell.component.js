import React, { useState } from 'react';
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

const CloudShell = ({
	user,
	authenticated,
	status,
	url,
	getShellStatus,
	deleteCloudShell,
}) => {
	const [height, setHeight] = useState(200);
	const [visibility, setVisibility] = useState(false);
	const intervalId = React.useRef(0);
	var deleting = false;

	if (status === 'DOWN' && deleting === true) {
		clearInterval(intervalId.current);
		deleting = false;
	} else if (status === 'UP' && deleting === false) {
		clearInterval(intervalId.current);
		intervalId.current = null;
	}

	const updateShellStatus = (user) => {
		getShellStatus(user);
		return updateShellStatus;
	};

	if (!visibility || status === 'DOWN') {
		const button =
			status && status === 'DOWN' ? (
				<LoopSharpIcon className="loading" />
			) : (
				<KeyboardIcon />
			);
		return (
			<div style={{ position: 'fixed', bottom: 0, zIndex: 999 }}>
				<IconButton
					aria-label="maximize"
					onClick={() => {
						if ((!status || status === 'DOWN') && deleting === false) {
							intervalId.current = setInterval(updateShellStatus(user), 5000);
						}
						setVisibility(true);
					}}
					className="maximize-shell"
				>
					{button}
				</IconButton>
			</div>
		);
	}

	var content = null;
	if (status) {
		content = (
			<Resizable
				size={{
					height: { height },
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

	const CloudShellIconButton = withStyles({
		root: {
			color: 'white',
		},
	})(IconButton);

	return (
		<div style={{ position: 'fixed', bottom: 0, zIndex: 999, width: '100%' }}>
			{console.log(user)}
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
						window.open(
							String(document.getElementById('cloudshell-iframe').src),
							'_blank'
						);
						setVisibility(false);
					}}
					className="opennewtab-shell"
				>
					<OpenInNewIcon />
				</CloudShellIconButton>

				<CloudShellIconButton
					aria-label="delete"
					onClick={() => {
						deleting = true;
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
			{content}
		</div>
	);
};

export default CloudShell;
