import React, { useEffect } from 'react';
import { Button, Typography, Paper } from '@material-ui/core/';
import Ligne from 'js/components/commons/files';
import './sandbox.scss';

const Sandbox = ({
	serviceId,
	taskId,
	browseSandbox,
	uploadFile,
	downloadFile,
	sandbox,
	match,
}) => {
	useEffect(() => {
		const path = match.params.filePath
			? decodeURIComponent(match.params.filePath) || '/'
			: '/';
		const action = match.params.action;
		if (action === 'view') {
			downloadFile(taskId, path);
		} else if (action === 'upload') {
			uploadFile(taskId, path);
		} else {
			browseSandbox(taskId, path);
		}
	}, [
		browseSandbox,
		uploadFile,
		downloadFile,
		taskId,
		match.params.filePath,
		match.params.action,
	]);

	if (!taskId) {
		return <></>;
	}

	return (
		<Paper className="paragraphe" elevation={1}>
			<Typography variant="h3" gutterBottom>
				Fichiers
			</Typography>
			<div>
				{sandbox ? (
					<>
						{sandbox.map((file) => {
							const mode = file.mode;
							const relativePath = file.relativePath;
							const fileName = file.path.split('/').slice(-1)[0];
							const isDirectory = mode.charAt(0) === 'd';
							console.log(encodeURIComponent(relativePath));
							return (
								<div className="file-block" key={fileName}>
									<Ligne
										icone={isDirectory ? 'folder' : 'description'}
										name={`${fileName} (${file.size})`}
										path={`/my-lab/mes-services/${serviceId}/task/${taskId}/file/${encodeURIComponent(
											relativePath
										)}${isDirectory ? '/' : '/view'}`}
										item
									></Ligne>
									<Button
										onClick={() =>
											downloadFile(
												taskId,
												encodeURIComponent(relativePath),
												true
											)
										}
										className="MuiFab-primary"
										style={{ visibility: isDirectory ? 'hidden' : 'visible' }}
									>
										<i className="material-icons">save_alt</i>
									</Button>
									<Button
										onClick={() =>
											uploadFile(taskId, encodeURIComponent(relativePath))
										}
										className="MuiFab-primary"
										style={{ visibility: isDirectory ? 'hidden' : 'visible' }}
										disabled={true}
									>
										<i className="material-icons">cloud_download</i>
									</Button>
								</div>
							);
						})}
					</>
				) : (
					<div>Loading ...</div>
				)}
			</div>
		</Paper>
	);
};

export default Sandbox;
