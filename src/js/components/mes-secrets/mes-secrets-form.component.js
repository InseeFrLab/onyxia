import React from 'react';
import PropTypes from 'prop-types';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/Save';
import CopyableField from 'js/components/commons/copyable-field';
import FormDialog from 'js/components/commons/form-dialog';

class SecretsForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			initialData: Object.assign({}, this.props.secretData),
			currentData: this.props.secretData,
		};
		this.handleChange = this.handleChange.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
	}

	handleChange = (key) => (newValue) => {
		let newData = this.state.currentData;
		newData[key] = newValue;
		this.setState({ currentData: newData });
	};

	handleDelete = (key) => () => {
		let newData = this.state.currentData;
		delete newData[key];
		this.setState({ currentData: newData });
	};

	onUpdate = () => {
		if (this.props.onUpdate) {
			this.props.onUpdate({
				location: this.props.location,
				data: this.state.currentData,
			});
		}
	};

	addPair = ({ key, value }) => {
		let newData = this.state.currentData;
		newData[key] = value;
		this.setState({ currentData: newData });
	};

	render() {
		const currentData = this.state.currentData;

		return (
			<>
				<ul>
					{currentData
						? Object.entries(currentData).map(([k, v], i) => (
								<li key={k}>
									<CopyableField
										copy
										del
										label={k}
										value={v}
										type="string"
										onChange={this.handleChange(k)}
										onDelete={this.handleDelete(k)}
									/>
								</li>
						  ))
						: 'Secrets en cours de chargement ...'}
				</ul>

				<FormDialog
					onOK={this.addPair}
					title="Ajouter un secret"
					description="Entrez la clé et la valeur du nouveau secret"
					okText="Ajouter"
					nopText="Annuler"
				/>
				<Fab aria-label="delete" onClick={this.onUpdate}>
					<SaveIcon />
				</Fab>
			</>
		);
	}
}

SecretsForm.propTypes = {
	secretData: PropTypes.object.isRequired,
	location: PropTypes.string.isRequired,
	onUpdate: PropTypes.func,
};

export default SecretsForm;
