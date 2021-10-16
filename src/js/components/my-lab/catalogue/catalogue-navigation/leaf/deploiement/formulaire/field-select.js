import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import { FormControl, InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

 
export default ({
	handleChange,
	nom,
	path,
	value,
	description,
	disabled = false,
	options,
}) => (
	<FormControl className="champ-texte" aria-describedby={`name-helper-${path}`}>
		<InputLabel htmlFor={`field-${path}`}>{nom}</InputLabel>
		<Select
			value={value || ''}
			disabled={disabled}
			onChange={(e) => handleChange(path)(e.target.value)}
			inputProps={{
				name: nom,
				id: `field-${path}`,
			}}
		>
			{options.map((o, i) => (
				<MenuItem key={i} value={o}>
					{o}
				</MenuItem>
			))}
		</Select>
		<FormHelperText id={`name-helper-${path}`}>{description}</FormHelperText>
	</FormControl>
);
