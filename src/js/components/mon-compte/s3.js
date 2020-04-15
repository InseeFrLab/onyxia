import React, { useState } from 'react';
import {
	InputAdornment,
	Input,
	InputLabel,
	IconButton,
	FormControl,
	Select,
	MenuItem,
} from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import * as clipboard from 'clipboard-polyfill';
import D from 'js/i18n';

const S3Field = ({ versionsList, handleReset }) => {
	const [password, setPassword] = useState(versionsList.V1);
	const handleVersionChange = (event) => {
		setPassword(versionsList[event.target.value]);
	};

	if (!versionsList) return null;
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
				label={D.pwdTitle}
				fullWidth
				value={password}
				endAdornment={
					<InputAdornment position="end">
						<SelectVersion
							versionsList={versionsList}
							handleVersionChange={handleVersionChange}
						/>
						<IconButton
							aria-label="rafraîchir le mot de passe"
							onClick={handleReset}
						>
							<AutorenewIcon />
						</IconButton>
						<IconButton
							aria-label="copier dans le presse papier"
							onClick={() => clipboard.writeText(password)}
						>
							<FileCopy />
						</IconButton>
					</InputAdornment>
				}
			/>
		</FormControl>
	);
};

const SelectVersion = ({ versionsList, handleVersionChange }) => {
	const [version, setVersion] = useState(
		versionsList[Object.keys(versionsList)[0]]
	);
	const handleChange = (event) => {
		handleVersionChange(event);
		setVersion(event.target.value);
	};

	return (
		<Select
			labelId="demo-simple-select-label"
			id="demo-simple-select"
			value={version}
			onChange={handleChange}
		>
			{Object.keys(versionsList).map((k) => (
				<MenuItem value={k}>{k}</MenuItem>
			))}
		</Select>
	);
};

export default S3Field;
