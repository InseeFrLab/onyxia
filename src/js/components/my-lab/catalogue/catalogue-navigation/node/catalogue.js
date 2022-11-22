import React, { useState, useEffect } from 'react';
import { Typography, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { restApiPaths } from 'js/restApiPaths';
import ChipsSelector from 'js/components/commons/chips-selector';
import Carte from './carte-service.component';
import Loader from 'js/components/commons/loader';
import { prAxiosInstance } from "core/adapters/officialOnyxiaApiClient";

const Node = ({ location }) => {
	const [idCatalogue] = useState(() =>
		location.split('/').reduce((a, x) => (x.length > 0 ? x : a))
	);
	const [chipsSelected, setChipSelected] = useState([]);
	const [chips, setChips] = useState([]);
	const [catalogue, setCatalogue] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {

		(async () => {

			(await prAxiosInstance)(`${restApiPaths.catalogue}/${idCatalogue}`)
				.then(({ data }) => data)
				.then((res) => {
					setCatalogue(res);
					setChips(
						res.catalog.packages.reduce(
							(a, { name, tags = [] }) =>
								mergeTab(
									a,
									[{ value: name, style: 'app-name', title: 'application' }],
									tags.map((t) => ({
										value: t,
										style: 'tag-token',
										title: 'tag',
									})),
									[]
								),
							[]
						)
					);
					setLoading(false);
				});


		})();



	}, [idCatalogue]);

	const addChip = (chip) => {
		setChipSelected([...chipsSelected, chip]);
	};

	const removeChip = (chip) => {
		setChipSelected(chipsSelected.filter((c) => c !== chip));
	};

	const setServiceSelected = () => null;

	return (
		<>
			<div className="en-tete">
				{loading ? (
					<Loader />
				) : (
						<Typography
							variant="h2"
							align="center"
							color="textPrimary"
							gutterBottom
						>
							{catalogue.name}
						</Typography>
					)}
			</div>
			<FilDAriane fil={fil.catalogue(idCatalogue)} />
			<div className="contenu catalogue">
				{loading ? (
					<Loader em={18} />
				) : (
						<>
							<Paper className="paper" elevation={1}>
								<Typography
									variant="h3"
									align="center"
									color="textPrimary"
									gutterBottom
								>
									Description
							</Typography>
								<Typography variant="body1" color="textPrimary" gutterBottom>
									{catalogue.description}
								</Typography>
								<Typography variant="body1" color="textPrimary" gutterBottom>
									Le package est mis à disposition par&nbsp;
								<strong>{catalogue.maintainer}</strong>
								</Typography>
							</Paper>
							<Paper className="paper" elevation={1}>
								<Typography
									variant="h3"
									align="center"
									color="textPrimary"
									gutterBottom
								>
									Vos Services
							</Typography>
								<Typography variant="subtitle1">
									Rechercher un service{' '}
								</Typography>
								<ChipsSelector
									chips={chips}
									addChip={addChip}
									removeChip={removeChip}
								/>
								<Grid container spacing={2} alignItems="flex-end">
									{catalogue && catalogue.catalog.packages
										? mapCatalogueToCards(catalogue)(chipsSelected)(
											setServiceSelected
										)
										: null}
								</Grid>
							</Paper>
						</>
					)}
			</div>
		</>
	);
};

export default Node;

/* */

// merge une liste de tableau en évitant les doublons
const mergeTab = (a, ...rest) => {
	if (rest.length === 0) {
		return a;
	}
	const [b, ...other] = rest;
	const merged = mergeTwoTabWithoutDouble(a, b);
	return mergeTab(merged, ...other);
};

// merge 2 tableaux {value,color} en évitant les doublons
const mergeTwoTabWithoutDouble = (a, b) => {
	if (b.length === 0) return a;
	const [f, ...rest] = b;
	const lower = { ...f, value: f.value.toLowerCase() };
	// return a.indexOf(lower) !== -1
	return a.find((c) => c.value === f.value && c.title === f.title) !== undefined
		? mergeTwoTabWithoutDouble(a, rest)
		: mergeTwoTabWithoutDouble([...a, lower], rest);
};

/*
 * Utilitaires pour générer les chips à partir du catalogue.
 */

/*
 * génération des cartes du catalogues.
 */

const displayServiceWithChips = (chips) => (service) =>
	chips.reduce(
		(a, { value, title }) =>
			a ||
			(title === 'application'
				? value === service.name.toLowerCase()
				: false) ||
			(title === 'tag' ? isInTag(service)(value) : false),
		false
	);

const isInTag = (service) => (token) =>
	service.tags.reduce((a, tag) => a || tag.toLowerCase() === token, false);

const mapCatalogueToCards = (catalogue) => (chips) => (setServiceSelected) =>
	chips.length > 0
		? mapFilteringCatalogueToCards(catalogue)(displayServiceWithChips(chips))(
			setServiceSelected
		)
		: mapFilteringCatalogueToCards(catalogue)(() => true)(setServiceSelected);

const mapFilteringCatalogueToCards = (catalogue) => (filtering) => (
	setServiceSelected
) => {
	return catalogue.catalog.packages
		.filter((pkg) => !pkg.disable)
		.map((service, i) =>
			filtering(service) ? (
				<Carte
					key={i}
					idCatalogue={catalogue.id}
					service={service}
					setServiceSelected={setServiceSelected}
				/>
			) : null
		);
};
