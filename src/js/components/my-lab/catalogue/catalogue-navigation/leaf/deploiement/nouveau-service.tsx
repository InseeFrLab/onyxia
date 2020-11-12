import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { AppBar, Chip, Button } from '@material-ui/core/';
// @ts-ignore
import queryString from 'query-params';
import { Redirect } from 'react-router-dom';
import Formulaire from './formulaire';
import { CustomService } from "./custom-service/component";
import { getAvatar } from 'js/utils';
import { getMinioToken } from "js/minio-client/minio-client";
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { getDefaultSingleOption } from 'js/universe/universeContractFiller';
import './nouveau-service.scss';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Loader from 'js/components/commons/loader';
import JSONEditor from 'js/components/commons/json-editor';
import { axiosPublic } from "js/utils/axios-config";
import { fromUser, filterOnglets } from 'js/utils';
import { restApiPaths } from 'js/restApiPaths';
import useBetaTest from 'js/components/hooks/useBetaTest';
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { unwrapResult } from "@reduxjs/toolkit";
import { actions } from "js/redux/legacyActions";
import { useDispatch, useSelector } from "js/redux/hooks";
import type { RootState } from "js/../libs/setup";

type Service = {
	category: "group" | "service";
	catalogId: string;
	name: string;
	currentVersion: number;
	postInstallNotes?: string;
	config: { properties: Record<string, Onglet>; };
};

type MinioCredentials = AsyncReturnType<typeof getMinioToken>;

export type Props = {
	idCatalogue: string;
	idService: string;
};

export const NouveauService: React.FC<Props> = ({
	idCatalogue,
	idService
}) => {
	const [redirect, setRedirect] = useState(false);
	const [service, setService] = useState<Service | undefined>(undefined);
	const [onglet, setOnglet] = useState(0);
	const [fieldsValues, setFieldsValues] = useState<Record<string, string>>({});
	const [initialValues, setInitialValues] = useState<Record<string, string>>({});
	const [ongletFields, setOngletFields] = useState<{
		description: string; nom: string; fields: {
			field: Record<string, Pick<{


				value: string;
				hidden: boolean;
				type: string;

			}, "hidden">>
		}[];
	}[]>([]);
	const user = useSelector(state => state.user);
	const userProfileInVoltState = useSelector(state => state.userProfileInVolt);
	const authenticated = useSelector(state => state.app.authenticated);
	const dispatch = useDispatch();


	const [minioCredentials, setMinioCredentials] = useState<MinioCredentials | undefined>(undefined);
	const [contract, setContract] = useState<object | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const [betaTester] = useBetaTest();

	const queryParams = queryString.decode(getCleanParams());

	const handleClickCreer = useCallback(
		(preview = false) => {

			assert(typeGuard<Extract<typeof service, { name: string; }>>(service));

			dispatch(
				actions.creerNouveauService({
					"service": {
						...service,
						catalogId: idCatalogue,
					},
					"options": getValuesObject(fieldsValues) as any,
					"dryRun": preview
				})
			)
				.then(unwrapResult)
				.then((response) => {

					if (preview && !contract) {
						setContract(response);
					} else if (preview && contract) {
						setContract(undefined);
					} else {
						setRedirect(true);
					}
				});

		},
		[service, idCatalogue, fieldsValues, contract, dispatch]
	);

	useEffect(() => {
		if (!authenticated) {
			getKeycloakInstance().login();
		}
	}, [authenticated]);

	useEffect(() => {
		if (authenticated) {
			getService(idCatalogue, idService).then((res) => {
				setService(res as any);
				setLoading(false);
			});
		}
	}, [idCatalogue, idService, authenticated]);

	useEffect(() => {
		if (authenticated && !minioCredentials) {
			getMinioToken()
				.then(setMinioCredentials)
		}
	}, [minioCredentials, authenticated]);

	useEffect(() => {
		if (queryParams.auto) {
			handleClickCreer(false);
		}
	}, [queryParams.auto, handleClickCreer]);

	useEffect(() => {
		if (
			service &&
			minioCredentials &&
			ongletFields.length === 0
		) {
			const { iFV, fV, oF } = getOptions(
				user,
				userProfileInVoltState,
				service,
				minioCredentials,
				queryParams
			);
			setInitialValues(iFV);
			setFieldsValues(fV);
			setOngletFields(oF as any);
		}
	}, [user, userProfileInVoltState, service, minioCredentials, ongletFields, queryParams]);

	const handlechangeField = (path: string) => (value: string) => {
		setFieldsValues({ ...fieldsValues, [path]: value });
		setContract(undefined);
	};
	if (redirect) return <Redirect to="/my-services" />;
	const ongletContent = filterOnglets(ongletFields)[onglet] || {};
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
								<Chip avatar={getAvatar(service)} label={(service && "name" in service) ? service.name : undefined} />
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
									onChange={(...[, o]) => setOnglet(o)}
									variant="scrollable"
									scrollButtons="on"
								>
									{mapServiceToOnglets(ongletFields as any)}
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
								{betaTester ? (
									<IconButton
										id="bouton-preview-nouveau-service"
										//variant="contained"
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




type Onglet = {
	description?: string;
	properties: Record<string, {
		type: "boolean" | "number" | "string" | "object";
		properties: {
			path: string;
			field: Omit<Onglet["properties"][string], "type"> & {
				nom: string;
				type: Onglet["properties"][string]["type"] | "select";
				options: string[];
			}
		}[];
		enum: string[];
		title: string;
	}>;
};

const getOnglets = (onglets: Record<string, Onglet>) =>
	Object.entries(onglets)
		.map(([nom, onglet]) => mapOngletToFields(nom)(onglet))
		.filter((o) => o.fields && o.fields.length > 0);

const mapOngletToFields = (nom: string) => (onglet: Onglet) => ({
	nom: nom,
	description:
		onglet.description || 'Cet onglet ne possède pas de description.',
	fields: getFields(nom)(onglet.properties),
});

const getFields = (nom: string) => (ongletProperties: Onglet["properties"]) => {
	if (!ongletProperties) {
		return;
	}
	const fields: Onglet["properties"][string]["properties"] = [];

	Object.entries(ongletProperties).forEach(([key, entry]) => {
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
						options: options,
					},
				});
				break;
			case 'object':

				const fieldsToAdd = getFields(`${nom}.${key}`)(properties as any);

				assert(fieldsToAdd !== undefined);

				fields.push(...fieldsToAdd);

				break;
			default:
				break;
		}
	});

	return fields;
};

const arrayToObject =
	(minioCredentials: MinioCredentials) =>
		(queryParams: Record<string, string>) =>
			(user: RootState["user"], userProfileInVoltState: RootState["userProfileInVolt"]) =>
				(fields: { path: string; field: { "js-control": string; type: string; }; }[]) => {
					const obj: Record<string, any> = {};
					const fromParams = getFromQueryParams(queryParams);
					fields.forEach(({ path, field }) =>
						obj[path] =
						fromParams(path)(field) ||
						fromUser({ ...user, minio: { ...minioCredentials } } as any, userProfileInVoltState)(field as any) ||
						getDefaultSingleOption(field)
					);
					return obj;
				};

const getCleanParams = () =>
	window.location.search.startsWith('?')
		? window.location.search.substring(1, window.location.search.length)
		: window.location.search;

const getFromQueryParams =
	(queryParams: Record<string, string>) =>
		(path: string) =>
			({ 'js-control': jsControl, type, }: { "js-control": string; type: string; }) => {
				if (jsControl === 'ro') {
					return undefined;
				}
				return path in queryParams
					? type === 'boolean'
						? queryParams[path] === 'true'
						: queryParams[path]
					: undefined;
			};

const mapServiceToOnglets = (
	ongletFields: { nom: string; description: string; fields: { field: Record<string, { nom: string; hidden: boolean; }> }[]; }[]
) => filterOnglets(ongletFields).map(({ nom }, i) => <Tab key={i} label={nom} />);

/*
 * Fonctions permettant de remettre en forme les valeurs
 * de champs comme attendu par l'api.
 */
export const getValuesObject = (fieldsValues: Record<string, string>) =>
	Object.entries(fieldsValues)
		.map(([key, value]) => ({
			path: key.split('.'),
			value,
		}))
		.reduce((acc, curr) => ({ ...acc, ...getPathValue(curr)(acc) }), id<Record<string, string>>({}));

const getPathValue = ({ path: [first, ...rest], value }: { path: string[]; value: string; }) =>
	(other = id<Record<string, string>>({})): Record<string, string> => {
		if (rest.length === 0) {
			return { [first]: value, ...other };
		}
		return {
			...other,
			[first]: getPathValue({ path: rest, value })(other[first] as any) as any,
		};
	};

export const getOptions = (
	user: RootState["user"],
	userProfileInVolt: RootState["userProfileInVolt"],
	service: Service,
	minioCredentials: MinioCredentials,
	queryParams: Record<string, string>
) => {
	const onglets =
		(service && service.config && service.config.properties) || {};
	const oF = getOnglets(onglets);
	const fields = oF.map((onglet) => onglet.fields);
	const fV = fields.reduce(
		(acc, curr) => ({
			...acc,
			...arrayToObject(minioCredentials)(queryParams)(
				user, 
				userProfileInVolt
			)(curr as any),
		}),
		{}
	);
	const iFV = fields.reduce(
		(acc, curr) => ({
			...acc,
			...arrayToObject(minioCredentials)({})(
				user, 
				userProfileInVolt
			)(curr as any),
		}),
		{}
	);
	return { fV, iFV, oF };
};

export const getService = async (idCatalogue: string, idService: string) =>
	axiosPublic(`${restApiPaths.catalogue}/${idCatalogue}/${idService}`);
