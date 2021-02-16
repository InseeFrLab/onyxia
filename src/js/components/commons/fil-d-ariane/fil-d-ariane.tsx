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

export const fil: any = {
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
	catalogue: (idCatalogue: any) => [
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
	training: (_id: any, title: any) => [
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
	services: ({ id, title }: { id: any, title: any}) => [
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
	myServices: (id: any) => [
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
	myService: (id: any) => [
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

	myFiles: (bucketName: any) => (paths: any) => [
		home,
		{ "anchorProps": routes.myBuckets().link, "component": <span>mes fichiers</span> },
		{
			anchorProps: routes.myFiles({ bucketName }).link,
			component: <span>{bucketName}</span>,
		},
		...paths.map(({ label, path }: { label: any, path: any }) => ({
			"anchorProps": routes.myFiles({ bucketName, "fileOrDirectoryPath": path }).link,
			component: <span>{label}</span>,
		})),
	],
	/* */
	serviceCatalogue: (idCatalogue: any, idService: any) => [
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
	nouveauService: (idCatalogue: any, idService: any) => [
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

const FilDAriane = ({ fil }: { fil: any}) => makeAll(fil);

FilDAriane.propTypes = {
	fil: PropTypes.arrayOf(
		PropTypes.shape({
			anchorProps: PropTypes.object.isRequired,
			component: PropTypes.object.isRequired,
		})
	),
};

const makeAll = ([home, ...rest]: any[]) => (
	<nav aria-label="Breadcrumb" className="fil-d-ariane-container">
		<ol className="fil-d-ariane">
			<li>
				<a {...home.anchorProps} className="home">{home.component}</a>
			</li>
			{makeRest(rest)}
		</ol>
	</nav>
);
const makeRest = ([curr, ...rest]: any[], index: any = 1): any => {
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
