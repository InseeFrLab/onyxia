import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import dayjs from 'dayjs';
import GitInfo from 'react-git-info/macro';
import { Configuration, getConfiguration } from 'js/api/configuration';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import SelectRegion from './SelectRegion';
import { Region } from 'js/model/Region';
import CopyableField from '../commons/copyable-field';
import { useSelector, useDispatch } from 'react-redux';
import { newRegions, regionChanged } from 'js/redux/actions';
import { RootState } from 'js/redux';

const EnTete = () => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			A propos d'Onyxia
		</Typography>
	</div>
);

const extractRegion = (state: RootState) => state.regions.regions;
const extractSelectedRegion = (state: RootState) =>
	state.regions.selectedRegion;
const About = () => {
	const dispatch = useDispatch();
	const regions = useSelector(extractRegion);
	const selectedRegion = useSelector(extractSelectedRegion);

	useEffect(() => {
		getConfiguration().then((resp) => dispatch(newRegions(resp.regions)));
	}, [dispatch]);

	const changeRegion = (newRegion: Region) =>
		dispatch(regionChanged(newRegion));

	const gitInfo = GitInfo();
	const versionInterface =
		gitInfo.tags.length > 0 ? gitInfo.tags[0] : gitInfo.branch;
	const versionInterfaceDate = gitInfo.commit.date;
	/*const versionServeur = configuration
		? `${configuration.build.version} (${dayjs(
				configuration.build.timestamp * 1000
		  ).format()})`
		: ' introuvable';*/
	const versionServeur = '';
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
					regions={regions}
					selectedRegion={selectedRegion?.id}
					onRegionSelected={(region) => changeRegion(region)}
				/>

				{JSON.stringify(regions)}
			</div>
		</>
	);
};

export default About;
