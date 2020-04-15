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

const S3Field = ({ value, handleReset }) => {
	const [password, setPassword] = useState(value);
	const handleVersionChange = (event) => {
		setPassword(event.target.value);
	};
	const versionsList = [1, 2, 3];

	if (!value) return null;
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
							onClick={() => clipboard.writeText(value)}
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
	const [version, setVersion] = useState(versionsList[0]);
	const handleChange = (event) => {
		setVersion(event.target.value);
		handleVersionChange(event);
	};

	return (
		<Select
			labelId="demo-simple-select-label"
			id="demo-simple-select"
			value={version}
			onChange={handleChange}
		>
			{versionsList.map((i) => (
				<MenuItem value={i}>V{i}</MenuItem>
			))}
		</Select>
	);
};

export default S3Field;
