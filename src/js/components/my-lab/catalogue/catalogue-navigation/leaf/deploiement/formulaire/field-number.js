import React from 'react';
import { TextField } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';

 
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
