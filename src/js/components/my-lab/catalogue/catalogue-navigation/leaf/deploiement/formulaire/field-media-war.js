import React from 'react';
import { TextField } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import getMinioApi from 'js/minio-client/minio-api';
import { getMinioClient } from "js/minio-client/minio-client";
import { getValidatedEnv } from 'app/validatedEnv';
import { HidablePane } from 'js/components/commons/HidablePane';

class SelectWarField extends React.Component {
	state = { paths: [], displayOptions: false };
	timer = null;
	anchor = React.createRef();
	constructor(props) {
		super(props);
		getWarPath(props.user)
			.then((paths) => {
				this.setState({ paths: paths });
			})
			.catch((e) => {
				this.setState({ paths: [] });
			});
	}

	handleSelectUrl = (url) => {
		this.props.handleChange(this.props.path)(url);
	};

	render() {
		const {
			handleChange,
			nom,
			path,
			value,
			description,
			disabled = false,
		} = this.props;
		return (
			<>
				<FormControl
					className="champ-media-war"
					aria-describedby={`name-helper-${path}`}
				>
					<TextField
						ref={this.anchor}
						disabled={disabled}
						id={nom}
						label={nom}
						value={value || ''}
						className="champ-texte"
						onChange={(e) => handleChange(path)(e.target.value)}
						margin="normal"
						onMouseEnter={this.displayOptions}
						onMouseLeave={this.hideOptions}
						title={value}
					/>
					<HidablePane anchor={this.anchor.current} post={() => false}>
						<MenuList>
							{this.state.paths.map(({ url, name }, i) => (
								<MenuItem
									key={i}
									title={url}
									onClick={() => this.handleSelectUrl(url)}
								>
									{name}
								</MenuItem>
							))}
						</MenuList>
					</HidablePane>

					<FormHelperText id={`name-helper-${path}`}>
						{description}
					</FormHelperText>
				</FormControl>
			</>
		);
	}
}

const getWarPath = async (user) => {
	const client = await getMinioClient();
	const api = getMinioApi(client);
	const userObjects = await getUserObjects(api)(user.idep);

	return userObjects.reduce(
		(acc, { name }) =>
			name.endsWith('.war')
				? [...acc, { url: `${getValidatedEnv().MINIO.BASE_URI || ''}/${user.idep}/${name}`, name }]
				: acc,
		[]
	);
};

const getUserObjects = (api) => async (idep) => {
	const isExist = await api.isBucketExist(idep);

	if (isExist) {
		const stream = await api.listObjects(idep);
		const paths = [];
		return new Promise((resolve, reject) => {
			stream.on('data', (object) => {
				paths.push(object);
			});
			stream.on('end', (object) => {
				resolve(paths);
			});
			stream.on('error', ({ resource }) => reject('oupsss'));
		});
	}
	return Promise.resolve([]);
};

export default SelectWarField;
