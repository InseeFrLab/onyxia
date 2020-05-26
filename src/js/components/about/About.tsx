import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Tooltip } from '@material-ui/core';
import dayjs from 'dayjs';
import GitInfo from 'react-git-info/macro';
import { Configuration, getConfiguration } from 'js/api/configuration';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import SelectRegion from './SelectRegion';
import { Region } from 'js/model/Region';

const EnTete = () => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			A propos d'Onyxia
		</Typography>
	</div>
);

const About = () => {
	const [configuration, setConfiguration] = useState<Configuration>();
	const [selectedRegion, setSelectedRegion] = useState<Region>();

	useEffect(() => {
		getConfiguration().then((resp) => setConfiguration(resp));
	}, []);

	const gitInfo = GitInfo();
	return (
		<>
			<EnTete />
			<FilDAriane fil={fil.about} />
			<div className="contenu accueil">
				<SelectRegion
					regions={configuration?.regions}
					selectedRegion={selectedRegion?.id}
					onRegionSelected={(region) => setSelectedRegion(region)}
				/>
				<Typography gutterBottom noWrap>
					<Tooltip title={gitInfo.commit.message}>
						<>
							Interface :
							{gitInfo.tags.length > 0 ? gitInfo.tags[0] : gitInfo.branch}(
							{gitInfo.commit.date})
							<br />
							Serveur :
							{configuration
								? `${configuration.build.version} (
							  ${dayjs(configuration.build.timestamp * 1000).format()} 
							  )`
								: ' introuvable'}
							<br />
							Region :{' '}
							{configuration?.regions?.length > 0
								? configuration.regions[0].name
								: ' introuvable'}
						</>
					</Tooltip>
				</Typography>
			</div>
		</>
	);
};

export default About;
