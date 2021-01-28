import React from 'react';
import { TextField } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

 
export default ({
	handleChange,
	path,
	nom,
	value,
	disabled = false,
	description,
}) => {
	return (
		<FormControl
			className="champ-texte"
			aria-describedby={`name-helper-${path}`}
		>
			<TextField
				disabled={disabled}
				id={nom}
				label={nom}
				value={value || 0}
				onChange={(e) => handleChange(path)(e.target.value)}
				type="number"
				className="champ-nombre"
				margin="normal"
			/>
			<FormHelperText id={`name-helper-${path}`}>{description}</FormHelperText>
		</FormControl>
	);
};
