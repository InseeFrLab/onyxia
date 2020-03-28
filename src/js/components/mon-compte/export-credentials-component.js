import React, { useState } from 'react';
import { Typography, Grid, Select, MenuItem } from '@material-ui/core';
import exportTypes from './export-credentials-templates';
import D from 'js/i18n';
import { ExportFileButton, CopyButton } from 'js/components/commons/buttons';

const ExportCredentialsField = ({ credentials }) => {
	const [exportTypeId, changeExportType] = useState(exportTypes[0].id);
	const exportType = exportTypes.find((type) => type.id === exportTypeId);

	const handleChange = (e) => changeExportType(e.target.value);

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
							style={{ minWidth: 240 }}
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
						<ExportFileButton
							fileName={exportType.fileName}
							content={exportType.text(credentials)}
						/>
					</Grid>
					<Grid item>
						<CopyButton content={exportType.text(credentials)} />
					</Grid>
				</Grid>
			</Grid>
		</React.Fragment>
	);
};

export default ExportCredentialsField;
