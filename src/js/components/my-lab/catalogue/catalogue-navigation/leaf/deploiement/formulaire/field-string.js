import React from 'react';
import { TextField } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';

 
export default ({
	handleChange,
	nom,
	path,
	value,
	description,
	disabled = false,
}) => (
	<FormControl className="champ-texte" aria-describedby={`name-helper-${path}`}>
		<TextField
			disabled={disabled}
			id={nom}
			label={nom}
			value={value || ''}
			className="champ-texte"
			onChange={(e) => handleChange(path)(e.target.value)}
			margin="normal"
		/>
		<FormHelperText id={`name-helper-${path}`}>{description}</FormHelperText>
	</FormControl>
);
