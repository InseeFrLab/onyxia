import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import { Avatar, Card, CardContent } from '@material-ui/core/';
import { CardHeader, Grid, Icon } from '@material-ui/core/';
import Button from '@material-ui/core/Button';
import D from 'js/i18n';
import { wrapPromise, axiosPublic } from 'js/utils';
// import Chrismas from "js/components/commons/chrismas";
import './accueil.scss';

const resource = wrapPromise(
	axiosPublic(`${window.location.origin}/accueil.json`)
);

const Accueil = () => {
	const { bienvenue, cartes, precautions, applications } = resource.read();
	return (
		<>
			{/* <Chrismas /> */}
			<div className="accueil">
				<Welcome
					image={bienvenue.image}
					titre={bienvenue.titre}
					contenu={bienvenue.contenu}
					boutonQuestion={bienvenue.boutonQuestion}
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
						(
							{
								nom,
								image,
								resume,
								external,
								internal,
								avantages,
								couleur1,
								couleur2,
							},
							i
						) => (
							<App paire={i % 2 === 0} key={i}>
								<Commentaires
									title={nom}
									external={external}
									internal={internal}
									color={couleur1}
								>
									<Typography variant="body1" className="resume">
										{resume}
									</Typography>
									{avantages.map((av, j) => (
										<Benefit key={j}>{av}</Benefit>
									))}
								</Commentaires>
								<Image color={couleur2} name="r-studio" url={image} />
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

const App = ({ children, paire }) =>
	paire ? (
		<div className="app">
			{children[0]}
			{children[1]}
		</div>
	) : (
		<div className="app">
			{children[1]}
			{children[0]}
		</div>
	);
const Image = ({ url, name = 'application', color = 'lightseagreen' }) => (
	<div className="image" style={{ backgroundColor: color }}>
		<img alt={name} src={url} />
	</div>
);
const Commentaires = ({
	title,
	internal,
	external,
	children,
	color = 'snow',
}) => (
	<div className="commentaires" style={{ backgroundColor: color }}>
		<Typography variant="h3">{title}</Typography>
		{children}
		{internal ? <InternalLink url={internal} /> : null}
		{external ? <ExternalLink url={external} /> : null}
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

const Welcome = ({ image, titre, contenu, boutonQuestion }) => (
	<div className="bienvenue">
		<img alt="innovation" src={image} />
		<div className="message">
			<div className="contenu">
				<h1>{titre}</h1>
				<p>{contenu}</p>
				<Link to="/visite-guidee">
					<Button
						variant="outlined"
						style={{ color: 'snow', borderColor: 'snow' }}
					>
						{D.startVisit}
					</Button>
				</Link>
			</div>
		</div>
	</div>
);

export default Accueil;
