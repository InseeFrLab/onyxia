import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@material-ui/core';
import './fil-d-ariane.scss';
import D from 'js/i18n';
import { routes } from "app/router";
import { join as pathJoin } from "path";

const home = { "anchorProps": routes.home().link, "component": <Icon className="home-icone">home</Icon> };
const catalog = {
	"anchorProps": routes.catalog().link,
	"component": <span>catalogue</span>,
};

export const fil = {
	about: [
		home,
		{
			anchorProps: null,
			component: <span>A propos</span>,
		},
	],
	cluster: [
		home,
		{
			anchorProps: null,
			component: <span>{D.cluster}</span>,
		},
	],
	catalogues: [
		home,
		catalog
	],
	catalogue: (idCatalogue) => [
		home,
		catalog,
		{
			"anchorProps": routes.catalog({ "optionalTrailingPath": idCatalogue }),
			"component": <span>{idCatalogue}</span>
		}
	],
	trainings: [
		home,
		{
			anchorProps: null,
			component: <span>formations</span>,
		},
	],
	training: (id, title) => [
		home,
		{
			anchorProps: null,
			component: <span>formations</span>,
		},
		{
			//pathname: `/trainings/${id}`,
			anchorProps: null,
			component: <span>{title}</span>,
		},
	],
	monCompte: [
		home,
		{
			"anchorProps": routes.home().link,
			component: <span>Mon compte</span>,
		},
	],
	servicesCollaboratifs: [
		home,
		{
			//pathname: '/services',
			"anchorProps": null,
			component: <span>Services partagés</span>,
		},
	],
	services: ({ id, title }) => [
		home,
		{
			"anchorProps": routes.myServices().link,
			component: <span>services</span>,
		},
		{
			"anchorProps": routes.myService({ "serviceId": id }).link,
			"component": <span>{title}</span>
		},
	],
	myServices: (id) => [
		home,
		{
			"anchorProps": routes.myServices().link,
			component: <span>services</span>,
		},
		id &&
		{
			"anchorProps": routes.myService({ "serviceId": id }).link,
			"component": <span>{id}</span>
		}
	],
	myService: (id) => [
		home,
		{
			"anchorProps": routes.myServices().link,
			component: <span>services</span>,
		},
		{
			"anchorProps": routes.myService({ "serviceId": id }).link,
			"component": <span>{id}</span>
		}
	],
	/* */
	mesFichiers: [
		home,
		{ "anchorProps": routes.myBuckets().link, "component": <span>mes fichiers</span> },
	],

	myFiles: (bucketName) => (paths) => [
		home,
		{ "anchorProps": routes.myBuckets().link, "component": <span>mes fichiers</span> },
		{
			anchorProps: routes.myFiles({ bucketName }).link,
			component: <span>{bucketName}</span>,
		},
		...paths.map(({ label, path }) => ({
			"anchorProps": routes.myFiles({ bucketName, "fileOrDirectoryPath": path }).link,
			component: <span>{label}</span>,
		})),
	],
	/* */
	serviceCatalogue: (idCatalogue, idService) => [
		home,
		{ "anchorParams": routes.catalog().link, component: <span>catalogue</span> },
		{
			anchorParams: routes.catalog({ "optionalTrailingPath": idCatalogue }).link,
			component: <span>{idCatalogue}</span>,
		},
		{
			"anchorProps": routes.catalog({ "optionalTrailingPath": idService }).link,
			component: <span>{idService}</span>,
		},
	],
	nouveauService: (idCatalogue, idService) => [
		home,
		{ "anchorParams": routes.catalog().link, component: <span>catalogue</span> },
		{
			anchorParams: routes.catalog({ "optionalTrailingPath": idCatalogue }).link,
			component: <span>{idCatalogue}</span>,
		},
		{
			"anchorProps": routes.catalog({ "optionalTrailingPath": pathJoin(idCatalogue, idService) }).link,
			component: <span>{idService}</span>,
		},
		{
			"anchorProps": routes.catalog({ "optionalTrailingPath": pathJoin(idCatalogue, idService, "deploiement") }).link,
			component: <span>déploiement</span>,
		}
	],
};

const FilDAriane = ({ fil }) => makeAll(fil);

FilDAriane.propTypes = {
	fil: PropTypes.arrayOf(
		PropTypes.shape({
			anchorProps: PropTypes.object.isRequired,
			component: PropTypes.object.isRequired,
		})
	),
};

const makeAll = ([home, ...rest]) => (
	<nav aria-label="Breadcrumb" className="fil-d-ariane-container">
		<ol className="fil-d-ariane">
			<li>
				<a {...home.anchorProps} className="home">{home.component}</a>
			</li>
			{makeRest(rest)}
		</ol>
	</nav>
);
const makeRest = ([curr, ...rest], index = 1) => {
	if (!curr) return null;
	if (rest.length === 0) {
		return (
			<li>
				<i aria-current="page">{curr.component}</i>
			</li>
		);
	}
	return (
		<>
			<li>
				<a {...curr.anchorProps}>{curr.component}</a>
			</li>
			{makeRest(rest, index + 1)}
		</>
	);
};

export default FilDAriane;
