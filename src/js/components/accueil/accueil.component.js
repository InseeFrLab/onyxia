import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import { Avatar, Card, CardContent, Paper } from '@material-ui/core/';
import { CardHeader, Grid, Icon } from '@material-ui/core/';
import Button from '@material-ui/core/Button';
import D from 'js/i18n';
import { wrapPromise, axiosURL } from 'js/utils';
// import Chrismas from "js/components/commons/chrismas";
import './accueil.scss';
import { env } from "js/env";

const resource = wrapPromise(
	axiosURL(
		conf.CONTENT.HOMEPAGE_URL
			? conf.CONTENT.HOMEPAGE_URL
			: `${window.location.origin}/accueil.json`
	)
);

const Accueil = () => {
	const { bienvenue, cartes, precautions, applications } = resource.read();
	const imgTitleColor =
		(bienvenue.image && bienvenue.image.titleColor) || 'snow';
	return (
		<>
			{/* <Chrismas /> */}
			<div className="accueil">
				<Welcome
					image={bienvenue.image.url}
					imgTitleColor={imgTitleColor}
					titre={bienvenue.titre}
					contenu={bienvenue.contenu}
				/>
				<Grid className="valeurs" container spacing={2} alignItems="flex-end">
					{cartes.map(({ titre, contenu, icone }, i) => (
						<Carte title={titre} icon={icone} key={i}>
							<Typography variant="body1">{contenu}</Typography>
						</Carte>
					))}
				</Grid>
				<Precautions titre={precautions.titre}>
					{precautions.contenu}
				</Precautions>
				<div className="applications">
					{applications.map(
						({ nom, image, resume, external, internal, avantages }, i) => (
							<App
								paire={i % 2 === 0}
								key={i}
								color={i % 2 === 0 ? 'gainsboro' : 'snow'}
							>
								<Commentaires
									title={nom}
									external={external}
									internal={internal}
								>
									<Typography variant="body1" className="resume">
										{resume}
									</Typography>
									{avantages.map((av, j) => (
										<Benefit key={j}>{av}</Benefit>
									))}
								</Commentaires>
								<Image name="r-studio" url={image} />
							</App>
						)
					)}
				</div>
			</div>
		</>
	);
};

const Carte = ({ icon = 'star', title, children }) => (
	<Grid item lg={4} md={6} xs={12} classes={{ item: 'carte' }}>
		<Card className="carte">
			<CardHeader
				avatar={
					<Avatar>
						<Icon>{icon}</Icon>
					</Avatar>
				}
				title={<Typography variant="h3">{title}</Typography>}
			/>
			<CardContent>{children}</CardContent>
		</Card>
	</Grid>
);

const App = ({ children, paire, color = 'snow' }) => (
	<div className="app" style={{ backgroundColor: color }}>
		{children[paire ? 0 : 1]}
		{children[paire ? 1 : 0]}
	</div>
);

const Image = ({ url, name = 'application' }) => (
	<div className="image" style={{ backgroundColor: '#5c6bc0' }}>
		<img alt={name} src={url} />
	</div>
);
const Commentaires = ({ title, internal, external, children }) => (
	<div className="commentaires">
		<Typography variant="h3">{title}</Typography>
		{children}
		<div className="centered">
			{internal ? <InternalLink url={internal} /> : null}
			{external ? <ExternalLink url={external} /> : null}
		</div>
	</div>
);

const InternalLink = ({ url }) => (
	<Link to={url}>
		<Button variant="outlined" color="secondary" className="bouton">
			{D.btnDiscover}
		</Button>
	</Link>
);

const ExternalLink = ({ url }) => (
	<Button
		variant="outlined"
		color="secondary"
		className="bouton"
		onClick={() => window.open(url)}
	>
		{D.btnDiscover}
	</Button>
);

const Benefit = ({ children }) => (
	<Typography variant="body1" className="avantage">
		<Icon className="chevron">keyboard_arrow_right</Icon>
		<span>{children}</span>
	</Typography>
);

const Precautions = ({ titre, children }) => (
	<div className="precautions">
		<div className="calque">
			<Typography variant="h3" align="center" className="titre">
				{titre}
			</Typography>
			<Typography className="contenu" variant="body1">
				{children}
			</Typography>
		</div>
		<div className="image" />
	</div>
);

const Welcome = ({ image, imgTitleColor, titre, contenu }) => (
	<div className="bienvenue">
		<img alt="innovation" src={image} />
		<div className="message">
			<div className="title" style={{ color: imgTitleColor }}>
				<h1>{titre}</h1>
			</div>
		</div>
		<Paper className="content">
			<p>{contenu}</p>
			<Link to="/visite-guidee">
				<Button variant="outlined">{D.startVisit}</Button>
			</Link>
		</Paper>
	</div>
);

export default Accueil;
