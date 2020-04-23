import React from 'react';
import {
	InputAdornment,
	Input,
	InputLabel,
	Typography,
} from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import * as clipboard from 'clipboard-polyfill';
import { IconButton, Icon } from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';
import OpenInNew from '@material-ui/icons/OpenInNew';
import Delete from '@material-ui/icons/Delete';

import PropTypes from 'prop-types';

class CopyableField extends React.Component {
	domInput = null;
	state = { edit: false, value: null, reset: false, isEditable: false };
	constructor(props) {
		super(props);
		this.state.value = props.value;
		this.state.isEditable = props.onChange !== undefined;
		this.state.reset = props.reset || false;
	}

	static getDerivedStateFromProps(props, state) {
		const ns = { ...state };
		ns.isEditable = props.onChange !== undefined;
		if (props.value !== state.value && !state.edit) {
			ns.value = props.value;
		}
		if (props.reset !== state.reset) {
			ns.edit = false;
			ns.reset = props.reset;
		}
		return ns;
	}

	copy = () => {
		clipboard.writeText(this.state.value);
		return false;
	};

	open = () => window.open(this.props.value);

	handleEdit = () => {
		this.setState((s, p) => {
			if (s.edit && p.onChange) {
				p.onChange(p.value);
			}
			return {
				value: p.value,
				edit: !this.state.edit,
			};
		});
	};

	handleValidate = () => {
		this.setState((s, p) => {
			if (s.edit && p.onChange) {
				p.onChange(p.value);
				p.onValidate(p.value);
			}
			return {
				value: p.value,
				edit: !this.state.edit,
			};
		});
	};

	handleChange = (e) => {
		const value =
			this.props.type === 'number' ? Number(e.target.value) : e.target.value;
		this.setState({ value });
		this.props.onChange(value);
	};

	del = () => {
		if (this.props.onDelete) {
			this.props.onDelete();
		}
	};

	render() {
		const {
			label,
			description,
			open = false,
			copy = false,
			del = false,
			type = 'string',
			options = {},
			onValidate,
		} = this.props;
		return (
			<>
				{description && (
					<Typography variant="body1" align="left">
						{description}
					</Typography>
				)}
				<FormControl className="copy-field" style={{ width: '100%' }}>
					{label ? <InputLabel>{label}</InputLabel> : null}
					<Input
						inputProps={options}
						inputRef={(r) => {
							this.domInput = r;
						}}
						disabled={!this.state.isEditable || !this.state.edit}
						type={type}
						label={label}
						fullWidth
						value={this.state.value}
						onChange={this.handleChange}
						endAdornment={
							<InputAdornment position="end">
								{this.state.isEditable && this.state.edit && !onValidate ? (
									<IconButton aria-label="éditer" onClick={this.handleEdit}>
										<Icon>clear</Icon>
									</IconButton>
								) : null}
								{this.state.isEditable && !this.state.edit ? (
									<IconButton aria-label="éditer" onClick={this.handleEdit}>
										<Icon>edit</Icon>
									</IconButton>
								) : null}
								{this.state.edit && onValidate ? (
									<IconButton aria-label="éditer" onClick={this.handleValidate}>
										<Icon>done</Icon>
									</IconButton>
								) : null}
								{copy ? (
									<IconButton
										aria-label="copier dans le presse papier"
										onClick={this.copy}
									>
										<FileCopy />
									</IconButton>
								) : null}
								{open ? (
									<IconButton aria-label="ouvrir" onClick={this.open}>
										<OpenInNew />
									</IconButton>
								) : null}
								{del ? (
									<IconButton aria-label="supprimer" onClick={this.del}>
										<Delete />
									</IconButton>
								) : null}
							</InputAdornment>
						}
					/>
				</FormControl>
			</>
		);
	}
}

CopyableField.propTypes = {
	reset: PropTypes.bool,
	label: PropTypes.string,
	fontSize: PropTypes.number,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	options: PropTypes.object,
};

export default CopyableField;
