import React from 'react';
import {
	InputLabel,
	Select,
	MenuItem,
	InputAdornment,
} from '@material-ui/core';

const ExportCredentialsField = ({ credentials }) => {
	const value = 'python';
	return (
		<>
			<InputLabel>Copier au format :</InputLabel>
			<Select value={value}>
				<MenuItem value="python">Python</MenuItem>
				<MenuItem value="r">R</MenuItem>
			</Select>
			<InputAdornment position="end"></InputAdornment>
		</>
	);
};

export default ExportCredentialsField;
