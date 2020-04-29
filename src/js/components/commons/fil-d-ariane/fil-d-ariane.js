import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Icon } from '@material-ui/core';
import './fil-d-ariane.scss';

export const fil = {
	accueil: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
	],
	catalogues: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/my-lab/catalogue',
			component: <span>catalogue</span>,
		},
	],
	catalogue: (idCatalogue) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/my-lab/catalogue',
			component: <span>catalogue</span>,
		},
		{
			pathname: `/my-lab/catalogue/${idCatalogue}`,
			component: <span>{idCatalogue}</span>,
		},
	],
	trainings: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/trainings',
			component: <span>formations</span>,
		},
	],
	training: (id, title) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/trainings',
			component: <span>formations</span>,
		},
		{
			pathname: `/trainings/${id}`,
			component: <span>{title}</span>,
		},
	],
	monCompte: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/mon-compte',
			component: <span>Mon compte</span>,
		},
	],
	servicesCollaboratifs: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/services',
			component: <span>Services partagés</span>,
		},
	],
	services: ({ id, title }) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{
			pathname: '/services',
			component: <span>services</span>,
		},
		{
			pathname: `/services/${id}`,
			component: <span>{title}</span>,
		},
	],
	myServices: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: '/my-services', component: <span>My lab</span> },
	],
	myService: (id) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: '/my-services', component: <span>My lab</span> },
		{
			pathname: `/my-service/${id}`,
			component: <span>{id}</span>,
		},
	],
	/* */
	mesFichiers: [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: '/mes-fichiers', component: <span>mes fichiers</span> },
	],

	myFiles: (bucketName) => (paths) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: '/mes-fichiers', component: <span>mes fichiers</span> },
		{
			pathname: `/mes-fichiers/${bucketName}`,
			component: <span>{bucketName}</span>,
		},
		...paths.map(({ label, path }) => ({
			pathname: `/mes-fichiers/${bucketName}${path}`,
			component: <span>{label}</span>,
		})),
	],
	/* */
	mesSecrets: (location) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		...location
			.split('/')
			.filter((c) => c.length > 0)
			.reduce(
				(a, c) => [
					...a,
					{
						pathname:
							a.length > 0
								? `${a[a.length - 1].pathname.replace(
										'?path=true',
										''
								  )}/${c}?path=true`
								: `/${c}?path=true`,
						component: <span>{c}</span>,
					},
				],
				[]
			),
	],
	/* */
	serviceCatalogue: (idCatalogue, idService) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: `/my-lab/catalogue`, component: <span>catalogue</span> },
		{
			pathname: `/my-lab/catalogue/${idCatalogue}`,
			component: <span>{idCatalogue}</span>,
		},
		{
			pathname: `/my-lab/catalogue/${idService}`,
			component: <span>{idService}</span>,
		},
	],
	nouveauService: (idCatalogue, idService) => [
		{ pathname: '/home', component: <Icon className="home-icone">home</Icon> },
		{ pathname: '/my-lab/catalogue', component: <span>catalogue</span> },
		{
			pathname: `/my-lab/catalogue/${idCatalogue}`,
			component: <span>{idCatalogue}</span>,
		},
		{
			pathname: `/my-lab/catalogue/${idCatalogue}/${idService}`,
			component: <span>{idService}</span>,
		},
		{
			pathname: `/my-lab/catalogue/${idCatalogue}/${idService}/deploiement`,
			component: <span>déploiement</span>,
		},
	],
};

const FilDAriane = ({ fil }) => makeAll(fil);

FilDAriane.propTypes = {
	fil: PropTypes.arrayOf(
		PropTypes.shape({
			pathname: PropTypes.string.isRequired,
			component: PropTypes.object.isRequired,
		})
	),
};

const makeAll = ([home, ...rest]) => (
	<nav aria-label="Breadcrumb" className="fil-d-ariane-container">
		<ol className="fil-d-ariane">
			<li>
				<Link to={home.pathname} className="home">
					{home.component}
				</Link>
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
				<Link to={curr.pathname}>{curr.component}</Link>
			</li>
			{makeRest(rest, index + 1)}
		</>
	);
};

export default FilDAriane;
