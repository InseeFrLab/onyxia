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
	if (!value) return null;
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
				label={D.pwdTitle}
				fullWidth
				value={value}
				endAdornment={
					<InputAdornment position="end">
						<SuperListeDeroulante infos={[1, 2, 3]}></SuperListeDeroulante>
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

const SuperListeDeroulante = ({ infos }) => {
	const [version, setVersion] = useState(0);

	const handleChange = (event) => {
		setVersion(event.target.version);
	};
	return (
		<Select
			labelId="demo-simple-select-label"
			id="demo-simple-select"
			value={version}
			onChange={handleChange}
		>
			{infos.map((i) => (
				<MenuItem value={i}>${i}</MenuItem>
			))}
		</Select>
	);
};

export default S3Field;
