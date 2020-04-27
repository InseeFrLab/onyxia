import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, Grid } from '@material-ui/core';
import { PauseIcon } from 'js/components/commons/icons';
import { CardContent, CardActions } from '@material-ui/core';
import { WorkInProgress } from 'js/components/commons/icons';
import Preloader from 'js/components/commons/preloader';
import WarningIcon from '@material-ui/icons/Warning';

const CarteService = ({
	id = '',
	actions: Actions,
	contenu: Contenu,
	wait = false,
	down = false,
	pause = false,
	title = null,
	subtitle = null,
	avatar = null,
	expiration = false,
}) => {
	const [raised, setRaised] = useState(false);
	return (
		<Grid item lg={3} md={4} xs={12} classes={{ item: 'carte' }}>
			<Card
				id={`carte-service-${id}`}
				className={`carte-service ${down ? 'down-app' : null}`}
				onMouseEnter={() => setRaised(true)}
				onMouseLeave={() => setRaised(false)}
				raised={raised}
				classes={{
					root: 'container',
				}}
			>
				{wait ? <Preloader card /> : null}
				{down ? <DownApp /> : null}
				{!down && expiration ? (
					<div className="expired">
						<div className="texte">
							<Grid container direction="row" alignItems="center">
								<Grid item>
									<WarningIcon fontSize="default" />
								</Grid>
								<Grid item>Token Expiré</Grid>
							</Grid>
						</div>
					</div>
				) : null}
				<CardHeader
					avatar={avatar}
					title={title}
					subheader={subtitle}
					classes={{
						root: 'en-tete',
						avatar: 'avatar',
						title: 'titre',
						subheader: 'sous-titre',
					}}
				/>
				<CardContent classes={{ root: 'contenu' }}>
					<Contenu />
					{pause ? (
						<div className="pause">
							<PauseIcon height={80} width={80} color="rgba(200,200,255,0.8)" />
						</div>
					) : null}
				</CardContent>
				<CardActions classes={{ root: 'boutons' }}>
					<Actions />
				</CardActions>
			</Card>
		</Grid>
	);
};

const DownApp = () => (
	<span className="work-in-progress">
		<WorkInProgress />
	</span>
);

CarteService.propTypes = {
	// service: serviceType,
	actions: PropTypes.func.isRequired,
	contenu: PropTypes.func.isRequired,
	wait: PropTypes.bool,
};

export default CarteService;
