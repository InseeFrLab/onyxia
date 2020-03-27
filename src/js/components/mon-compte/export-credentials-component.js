import React, { useState } from 'react';
import * as clipboard from 'clipboard-polyfill';
import { InputLabel, Select, MenuItem, IconButton } from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';
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
		<>
			<InputLabel>{D.exportIn}</InputLabel>
			<Select value={exportTypeId} onChange={handleChange}>
				{exportTypes.map((e) => (
					<MenuItem value={e.id}>{e.label}</MenuItem>
				))}
			</Select>
			<IconButton aria-label="copier dans le presse papier" onClick={copy}>
				<FileCopy />
			</IconButton>
		</>
	);
};

export default ExportCredentialsField;
