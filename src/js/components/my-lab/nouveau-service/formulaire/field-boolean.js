import React from 'react';
import { Checkbox } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export default ({
	handleChange,
	user,
	path,
	value,
	nom,
	disabled = false,
	description,
	...rest
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
						onChange={(e) => handleChange(path)(e.target.checked)}
						color="secondary"
					/>
				}
			/>

			<FormHelperText id={`name-helper-${path}`}>{description}</FormHelperText>
		</FormControl>
	);
};
