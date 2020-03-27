import React, { useState } from 'react';
import * as clipboard from 'clipboard-polyfill';
import {
	Typography,
	Grid,
	Select,
	MenuItem,
	IconButton,
} from '@material-ui/core';
import { FileCopy } from '@material-ui/icons';
import exportTypes from './export-credentials-templates';
import D from 'js/i18n';

const ExportCredentialsField = ({ credentials }) => {
	const [exportTypeId, changeExportType] = useState(exportTypes[0].id);
	const exportType = exportTypes.find((type) => type.id === exportTypeId);

	const handleChange = (e) => changeExportType(e.target.value);

	const copy = () => {
		clipboard.writeText(exportType.text(credentials));
		return false;
	};

	return (
		<React.Fragment>
			<Grid
				container
				direction="row"
				justify="space-between"
				alignItems="baseline"
			>
				<Grid container xs="10">
					<Grid item>
						<Typography variant="body1">{D.export}</Typography>
					</Grid>
					<Grid item>
						<Select value={exportTypeId} onChange={handleChange}>
							{exportTypes.map((e) => (
								<MenuItem variant="body1" value={e.id}>
									{e.label}
								</MenuItem>
							))}
						</Select>
					</Grid>
				</Grid>

				<Grid item>
					<IconButton aria-label="copier dans le presse papier" onClick={copy}>
						<FileCopy />
					</IconButton>
				</Grid>
			</Grid>
		</React.Fragment>
	);
};

export default ExportCredentialsField;
