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

interface Props {
	value: string;
	idep: string;
	handleReset: () => void;
	versionsList: Promise<Int16Array[]>;
	getPasswordByVersion: (string, Int16Array) => Promise<string>;
}

const S3Field = ({
	value,
	handleReset,
	versionsList,
	getPasswordByVersion,
	idep,
}: Props) => {
	const [password, setPassword] = useState(value);

	const handleVersionChange = (event) => {
		getPasswordByVersion(idep, event.target.value).then((pwd) =>
			setPassword(pwd)
		);
	};
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
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

interface PropsSelect {
	versionsList: Promise<Int16Array[]>;
	handleVersionChange: (any) => void;
}

const SelectVersion = ({ versionsList, handleVersionChange }: PropsSelect) => {
	const [version, setVersion] = useState(versionsList[0]);
	const handleChange = (event) => {
		handleVersionChange(event);
		setVersion(event.target.value);
	};

	return versionsList.then((vl) => {
		return (
			<Select value={version} onChange={handleChange}>
				{vl.map((k) => (
					<MenuItem value={k.toString()}>{k.toString()}</MenuItem>
				))}
			</Select>
		);
	});
};

export default S3Field;
