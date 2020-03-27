import React, { useState } from 'react';
import { InputLabel, Select, MenuItem } from '@material-ui/core';

const ExportCredentialsField = ({ credentials }) => {
	const [exportTypeId, changeExportType] = useState('python');

	const handleChange = (e) => changeExportType(e.target.value);

	const exportTypes = [
		{
			id: 'python',
			label: 'Python',
			text: (c) =>
				`le texte python : \n
					access key id: ${c.AWS_ACCESS_KEY_ID}\n
					s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
		},
		{
			id: 'r',
			label: 'R',
			text: (c) =>
				`le texte R : \n
					access key id: ${c.AWS_ACCESS_KEY_ID} \n
					s3 endpoint: ${c.AWS_S3_ENDPOINT}`,
		},
	];

	const exportType = exportTypes.find((type) => type.id === exportTypeId);

	return (
		<>
			<InputLabel>Copier au format :</InputLabel>
			<Select value={exportTypeId} onChange={handleChange}>
				{exportTypes.map((e) => (
					<MenuItem value={e.id}>{e.label}</MenuItem>
				))}
			</Select>
			<div>{exportType.text(credentials)}</div>
		</>
	);
};

export default ExportCredentialsField;
