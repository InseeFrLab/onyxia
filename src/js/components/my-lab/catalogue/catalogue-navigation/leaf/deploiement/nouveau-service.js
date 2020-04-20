import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { AppBar, Chip, Button } from '@material-ui/core/';
import queryString from 'query-params';
import { Redirect } from 'react-router-dom';
import Formulaire from './formulaire';
import CustomService from './custom-service';
import { getAvatar } from 'js/utils';
import { getMinioToken } from 'js/minio-client';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { getDefaultSingleOption } from 'js/universe/universeContractFiller';
import './nouveau-service.scss';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Loader from 'js/components/commons/loader';
import JSONEditor from 'js/components/commons/json-editor';
import { axiosPublic, fromUser, filterOnglets } from 'js/utils';
import api from 'js/redux/api';
import { getVaultToken } from 'js/vault-client';
import { hasOptedInForBetaTest } from 'js/configuration/betatest';

const NouveauService = ({
	idCatalogue,
	idService,
	user,
	creerNouveauService,
	authenticated,
}) => {
	const [redirect, setRedirect] = useState(false);
	const [service, setService] = useState({});
	const [onglet, setOnglet] = useState(0);
	const [fieldsValues, setFieldsValues] = useState({});
	const [initialValues, setInitialValues] = useState({});
	const [ongletFields, setOngletFields] = useState([]);
	const [minioCredentials, setMinioCredentials] = useState(undefined);
	const [contract, setContract] = useState(undefined);
	const [loading, setLoading] = useState(true);

	const queryParams = queryString.decode(getCleanParams());

	const handleClickCreer = useCallback(
		(preview = false) => {
			creerNouveauService(
				{
					...service,
					catalogId: idCatalogue,
				},
				getValuesObject(fieldsValues),
				preview
			).then((response) => {
				if (preview && !contract) {
					setContract(response);
				} else if (preview && contract) {
					setContract(undefined);
				} else {
					setRedirect(true);
				}
			});
		},
		[creerNouveauService, service, idCatalogue, fieldsValues, contract]
	);

	useEffect(() => {
		if (authenticated)
			axiosPublic(`${api.catalogue}/${idCatalogue}/${idService}`).then(
				(res) => {
					setService(res);
					setLoading(false);
				}
			);
	}, [idCatalogue, idService, authenticated]);

	useEffect(() => {
		if (authenticated && !minioCredentials) {
			getMinioToken()
				.then((credentials) => {
					setMinioCredentials(credentials);
				})
				.catch((e) => {
					setMinioCredentials({});
				});
		}
	}, [minioCredentials, authenticated]);

	useEffect(() => {
		if (!authenticated) getVaultToken();
	}, [authenticated, user]);

	useEffect(() => {
		if (queryParams.auto) {
			handleClickCreer(false);
		}
	}, [queryParams.auto, handleClickCreer]);

	useEffect(() => {
		if (
			hasPwd(user) &&
			service &&
			minioCredentials &&
			ongletFields.length === 0
		) {
			const onglets =
				(service && service.config && service.config.properties) || {};
			const oF = getOnglets(onglets);
			const fields = oF.map((onglet) => onglet.fields);
			const fV = fields.reduce(
				(acc, curr) => ({
					...acc,
					...arrayToObject(minioCredentials)(queryParams)(user)(curr),
				}),
				{}
			);
			const iFV = fields.reduce(
				(acc, curr) => ({
					...acc,
					...arrayToObject(minioCredentials)({})(user)(curr),
				}),
				{}
			);
			setInitialValues(iFV);
			setFieldsValues(fV);
			setOngletFields(oF);
		}
	}, [user, service, minioCredentials, ongletFields, queryParams]);

	const handlechangeField = (path) => (value) => {
		setFieldsValues({ ...fieldsValues, [path]: value });
		setContract(undefined);
	};
	if (redirect) return <Redirect to="/my-lab/mes-services" />;
	const ongletContent = ongletFields[onglet] || {};
	return (
		<>
			<div className="en-tete en-tete-service">
				<Typography
					variant="h2"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					Créez votre propre service
				</Typography>
				{loading || ongletFields.length === 0 ? (
					<Loader />
				) : (
					<div className="service">
						<div className="titre">
							<Chip avatar={getAvatar(service)} label={service.name} />
						</div>
					</div>
				)}
			</div>
			<FilDAriane fil={fil.nouveauService(idCatalogue, idService)} />
			<div className="contenu nouveau-service">
				{loading || ongletFields.length === 0 ? (
					<Loader em={18} />
				) : (
					<>
						<AppBar position="static">
							<Tabs
								value={onglet}
								onChange={(e, o) => setOnglet(o)}
								variant="scrollable"
								scrollButtons="on"
							>
								{mapServiceToOnglets(ongletFields)}
							</Tabs>
						</AppBar>
						<div className="description">
							<Typography
								variant="button"
								align="center"
								color="textPrimary"
								gutterBottom
							>
								{ongletContent.description}
							</Typography>
						</div>
						<Formulaire
							user={user}
							name={ongletContent.nom}
							handleChange={handlechangeField}
							fields={ongletContent.fields}
							values={fieldsValues}
						/>

						<div className="actions">
							<Button
								id="bouton-creer-nouveau-service"
								variant="contained"
								color="primary"
								onClick={() => handleClickCreer(false)}
							>
								Créer votre service
							</Button>
							{hasOptedInForBetaTest() ? (
								<IconButton
									id="bouton-preview-nouveau-service"
									variant="contained"
									color="primary"
									onClick={() => handleClickCreer(true)}
								>
									<VisibilityIcon>Preview</VisibilityIcon>
								</IconButton>
							) : (
								<></>
							)}
							{contract ? (
								<JSONEditor json={contract} readOnly={true} />
							) : (
								<></>
							)}
						</div>
						<div>
							<CustomService
								initialValues={initialValues}
								fieldsValues={fieldsValues}
								setInit={() => setFieldsValues(initialValues)}
							/>
						</div>
					</>
				)}
			</div>
		</>
	);
};

NouveauService.defaultProps = {
	user: {},
};

export default NouveauService;

const getOnglets = (onglets) =>
	Object.entries(onglets)
		.map(([nom, onglet]) => mapOngletToFields(nom)(onglet))
		.filter((o) => o.fields && o.fields.length > 0);

const mapOngletToFields = (nom) => (onglet) => ({
	nom: nom,
	description:
		onglet.description || 'Cet onglet ne possède pas de description.',
	fields: getFields(nom)(onglet.properties),
});

const getFields = (nom) => (onglet) => {
	if (!onglet) {
		return;
	}
	const fields = [];
	Object.entries(onglet).forEach(([key, entry]) => {
		const { type, properties, enum: options, title } = entry;

		switch (type) {
			case 'boolean':
			case 'number':
			case 'string':
				fields.push({
					path: `${nom}.${key}`,
					field: {
						...entry,
						type: options && options.length > 0 ? 'select' : type,
						nom: title || key,
						options,
					},
				});
				break;
			case 'object':
				fields.push(...getFields(`${nom}.${key}`)(properties));
				break;
			default:
				break;
		}
	});

	return fields;
};

const arrayToObject = (minioCredentials) => (queryParams) => (user) => (
	fields
) => {
	const obj = {};
	const fromParams = getFromQueryParams(queryParams);
	fields.forEach(
		({ path, field }) =>
			(obj[path] =
				fromParams(path)(field) ||
				fromUser({ ...user, minio: { ...minioCredentials } })(field) ||
				getDefaultSingleOption(field))
	);
	return obj;
};

const getCleanParams = () =>
	window.location.search.startsWith('?')
		? window.location.search.substring(1, window.location.search.length)
		: window.location.search;

const getFromQueryParams = (queryParams) => (path) => ({
	'js-control': jsControl,
	type,
}) => {
	if (jsControl === 'ro') {
		return undefined;
	}
	return path in queryParams
		? type === 'boolean'
			? queryParams[path] === 'true'
			: queryParams[path]
		: undefined;
};

const mapServiceToOnglets = (ongletFields) =>
	filterOnglets(ongletFields).map(({ nom }, i) => <Tab key={i} label={nom} />);

/*
 * Fonctions permettant de remettre en forme les valeurs
 * de champs comme attendu par l'api.
 */
const getValuesObject = (fieldsValues) =>
	Object.entries(fieldsValues)
		.map(([key, value]) => ({
			path: key.split('.'),
			value,
		}))
		.reduce((acc, curr) => ({ ...acc, ...getPathValue(curr)(acc) }), {});

const getPathValue = ({ path: [first, ...rest], value }) => (other = {}) => {
	if (rest.length === 0) {
		return { [first]: value, ...other };
	}
	return {
		...other,
		[first]: getPathValue({ path: rest, value })(other[first]),
	};
};

const hasPwd = (user) =>
	user && user.VAULT && user.VAULT.DATA && user.VAULT.DATA.password;
