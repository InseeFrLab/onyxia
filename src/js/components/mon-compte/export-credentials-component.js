import React, { useState } from 'react';
import * as clipboard from 'clipboard-polyfill';
import { InputLabel, Select, MenuItem, IconButton } from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';

const ExportCredentialsField = ({ credentials }) => {
	const exportTypes = [
		{
			id: 'python',
			label: 'Python',
			text: (c) =>
				`le texte python :
access key id: ${c.AWS_ACCESS_KEY_ID}
s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
		},
		{
			id: 'r',
			label: 'R',
			text: (c) =>
				`le texte R :
access key id: ${c.AWS_ACCESS_KEY_ID}
s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
		},
	];

	const [exportTypeId, changeExportType] = useState(exportTypes[0].id);
	const exportType = exportTypes.find((type) => type.id === exportTypeId);

	const handleChange = (e) => changeExportType(e.target.value);

	const copy = () => {
		clipboard.writeText(exportType.text(credentials));
		return false;
	};

	return (
		<>
			<InputLabel>Copier au format :</InputLabel>
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
