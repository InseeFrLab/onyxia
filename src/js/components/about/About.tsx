import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import dayjs from 'dayjs';
import GitInfo from 'react-git-info/macro';
import { Configuration, getConfiguration } from 'js/api/configuration';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import SelectRegion from './SelectRegion';
import { Region } from 'js/model/Region';
import CopyableField from '../commons/copyable-field';

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
	const versionInterface =
		gitInfo.tags.length > 0 ? gitInfo.tags[0] : gitInfo.branch;
	const versionInterfaceDate = gitInfo.commit.date;
	const versionServeur = configuration
		? `${configuration.build.version} (${dayjs(
				configuration.build.timestamp * 1000
		  ).format()})`
		: ' introuvable';
	return (
		<>
			<EnTete />
			<FilDAriane fil={fil.about} />
			<div className="contenu accueil">
				<CopyableField
					label="Interface version"
					value={`${versionInterface} (${versionInterfaceDate})`}
					copy
				/>
				<CopyableField label="Server version" value={versionServeur} copy />

				<SelectRegion
					regions={configuration?.regions}
					selectedRegion={selectedRegion?.id}
					onRegionSelected={(region) => setSelectedRegion(region)}
				/>

				<RegionInfo region={selectedRegion} />
			</div>
		</>
	);
};

const RegionInfo = ({ region }: { region: Region }) => (
	<Typography gutterBottom noWrap>
		{region ? JSON.stringify(region, null, 4) : ''}
	</Typography>
);

export default About;
