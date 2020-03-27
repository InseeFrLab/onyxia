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
		const pythonText = `ceci est l'export en Python : ${this.credentials.AWS_ACCESS_KEY_ID}`;
		const RText = `ceci est l'export en R : ${this.credentials.AWS_S3_ENDPOINT}`;

		const exportText = this.state.value === 'python' ? pythonText : RText;

		return (
			<>
				<InputLabel>Copier au format :</InputLabel>
				<Select value={this.state.value} onChange={this.handleChange}>
					<MenuItem value="python">Python</MenuItem>
					<MenuItem value="r">R</MenuItem>
				</Select>
				<div>{exportText}</div>
			</>
		);
	}
}

export default ExportCredentialsField;
