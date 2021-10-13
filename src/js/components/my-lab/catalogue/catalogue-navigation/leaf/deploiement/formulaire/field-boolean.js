import React from 'react';
import { Checkbox } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

 
export default ({
	handleChange,
	path,
	value,
	nom,
	disabled = false,
	description,
}) => {
	return (
		<FormControl
			className="champ-texte"
			aria-describedby={`name-helper-${path}`}
		>
			<FormControlLabel
				label={nom}
				disabled={disabled}
				control={
					<Checkbox
						checked={value}
						onChange={(e) => handleChange(path)(!value)}
						color="secondary"
					/>
				}
			/>

			<FormHelperText id={`name-helper-${path}`}>{description}</FormHelperText>
		</FormControl>
	);
};
