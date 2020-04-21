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
	handleReset: () => void;
	versionsList?: string[];
	onVersionChange?: () => void;
}

const S3Field = ({
	value,
	handleReset,
	versionsList,
	onVersionChange,
}: Props) => {
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
				fullWidth
				value={value}
				endAdornment={
					<InputAdornment position="end">
						{versionsList ? (
							<SelectVersion
								versionsList={versionsList}
								handleVersionChange={onVersionChange}
							/>
						) : (
							<></>
						)}
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

interface PropsSelect {
	versionsList: string[];
	handleVersionChange?: (any) => void;
}

const SelectVersion = ({ versionsList, handleVersionChange }: PropsSelect) => {
	const [versionIndex, setVersionIndex] = useState(0);
	const handleChange = (event) => {
		handleVersionChange && handleVersionChange(event);
		setVersionIndex(event.target.value);
	};

	return (
		<Select value={versionIndex} onChange={handleChange}>
			{versionsList.map((label, index) => (
				<MenuItem value={index}>{label}</MenuItem>
			))}
		</Select>
	);
};

export default S3Field;
