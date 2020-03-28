import React, { useState } from 'react';
import * as clipboard from 'clipboard-polyfill';
import {
	Typography,
	Grid,
	Select,
	MenuItem,
	IconButton,
} from '@material-ui/core';
import { FileCopy, Save } from '@material-ui/icons';
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
				<Grid container xs={8} justify="flex-start">
					<Grid item xs={4}>
						<Typography variant="body1">{D.export}</Typography>
					</Grid>
					<Grid item>
						<Select
							style={{ minWidth: 120 }}
							value={exportTypeId}
							onChange={handleChange}
						>
							{exportTypes.map((e) => (
								<MenuItem variant="body1" value={e.id}>
									{e.label}
								</MenuItem>
							))}
						</Select>
					</Grid>
				</Grid>
				<Grid container xs={4} justify="flex-end">
					<Grid item>
						<IconButton
							aria-label="copier dans le presse papier"
							onClick={copy}
						>
							<Save />
						</IconButton>
					</Grid>
					<Grid item>
						<IconButton
							aria-label="copier dans le presse papier"
							onClick={copy}
						>
							<FileCopy />
						</IconButton>
					</Grid>
				</Grid>
			</Grid>
		</React.Fragment>
	);
};

export default ExportCredentialsField;
