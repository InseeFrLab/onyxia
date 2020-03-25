import React from 'react';
import { TextField } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

export default ({
	handleChange,
	user,
	nom,
	path,
	value,
	description,
	disabled = false,
	...rest
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
