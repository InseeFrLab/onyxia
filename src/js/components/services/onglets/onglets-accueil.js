import React, { useState } from 'react';
import { Tabs, Tab } from '@material-ui/core';
import { AppBar } from '@material-ui/core';
import Content from './content';

const tabs = ['alphaServices', 'betaServices', 'stableServices'];

const OngletsAccueil = () => {
	const [onglet, setOnglet] = useState(tabs.length - 1);

	return (
		<div className="contenu accueil">
			<AppBar position="static">
				<Tabs
					id="onglets-accueil-services"
					value={onglet}
					onChange={(e, o) => setOnglet(o)}
				>
					<Tab label="Alpha" />
					<Tab label="Beta" />
					<Tab label="Stable" />
				</Tabs>
			</AppBar>
			<Content tab={tabs[onglet]} />
		</div>
	);
};

export default OngletsAccueil;
