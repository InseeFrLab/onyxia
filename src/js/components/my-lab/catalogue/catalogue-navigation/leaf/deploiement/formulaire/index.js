import React from 'react';
import { Grid } from '@material-ui/core';
import StringField from './field-string';
import BooleanField from './field-boolean';
import NumberField from './field-number';
import SelectField from './field-select';
import SelectWarField from './field-media-war';
import { getFieldSafeAttr } from 'js/utils/form-field';

export default ({ fields, user, handleChange, name, values, options }) => {
	const champs = fields.map(({ field, path }, i) => {
		const { nom, media, hidden, readonly, description } = getFieldSafeAttr(
			field
		);

		if (hidden) return null;

		switch (field.type) {
			case 'string':
				return media === 'war' ? (
					<Grid item lg={4} md={6} sm={12} key={i}>
						<SelectWarField
							nom={nom}
							user={user}
							disabled={readonly}
							handleChange={handleChange}
							path={path}
							value={values[path]}
							description={description}
						/>
					</Grid>
				) : (
					<Grid item lg={4} md={6} sm={12} key={i}>
						<StringField
							nom={nom}
							disabled={readonly}
							handleChange={handleChange}
							path={path}
							value={values[path]}
							description={description}
						/>
					</Grid>
				);
			case 'number':
				return (
					<Grid item lg={4} md={6} sm={12} key={i}>
						<NumberField
							nom={nom}
							disabled={readonly}
							handleChange={handleChange}
							path={path}
							value={values[path]}
							description={description}
						/>
					</Grid>
				);
			case 'boolean':
				return (
					<Grid item lg={4} md={6} sm={12} key={i}>
						<BooleanField
							nom={nom}
							disabled={readonly}
							handleChange={handleChange}
							path={path}
							value={values[path]}
							description={description}
						/>
					</Grid>
				);
			case 'select':
				return (
					<Grid item lg={4} md={6} sm={12} key={i}>
						<SelectField
							nom={nom}
							disabled={readonly}
							handleChange={handleChange}
							path={path}
							value={values[path]}
							description={description}
							options={options}
						/>
					</Grid>
				);
			default:
				return null;
		}
	});
	return (
		<form autoComplete="off" className={name === 'monkey' ? 'monkey' : 'nope'}>
			<Grid container spacing={8} classes={{ container: 'formulaire' }}>
				{champs}
			</Grid>
		</form>
	);
};
