import React from 'react';
import { InputLabel, Select, MenuItem } from '@material-ui/core';

class ExportCredentialsField extends React.Component {
	constructor(props) {
		super(props);
		this.state = { value: 'python' };
		this.credentials = props.credentials;
	}

	handleChange = (e) => this.setState({ value: e.target.value });

	render() {
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

		const exportType = exportTypes.find((type) => type.id === this.state.value);

		return (
			<>
				<InputLabel>Copier au format :</InputLabel>
				<Select value={this.state.value} onChange={this.handleChange}>
					{exportTypes.map((e) => (
						<MenuItem value={e.id}>{e.label}</MenuItem>
					))}
				</Select>
				<div>{exportType.text(this.credentials)}</div>
			</>
		);
	}
}

export default ExportCredentialsField;
