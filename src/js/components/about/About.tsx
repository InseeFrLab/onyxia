import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import dayjs from 'dayjs';
import GitInfo from 'react-git-info/macro';
import { Configuration, getConfiguration } from 'js/api/configuration';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import SelectRegion from './SelectRegion';
import { Region } from 'js/model/Region';
import CopyableField from '../commons/copyable-field';
import Table from '@material-ui/core/Table';
import {
	TableContainer,
	Paper,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from '@material-ui/core';
import {
	SentimentSatisfiedAlt,
	SentimentVeryDissatisfied,
} from '@material-ui/icons';

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

				<TableContainer component={Paper}>
					<Table aria-label="simple table">
						<TableHead>
							<TableRow>
								<TableCell>Region</TableCell>
								<TableCell>Localisation</TableCell>
								<TableCell>Type</TableCell>
								<TableCell>Stockage</TableCell>
								<TableCell>Monitoring</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{configuration?.regions?.map((region) => (
								<TableRow
									key={region.id}
									selected={region.id === selectedRegion?.id}
									onClick={() => setSelectedRegion(region)}
								>
									<TableCell component="th" scope="row">
										{region.name}
									</TableCell>
									<TableCell>{region?.location?.name || ''}</TableCell>
									<TableCell>{region.id}</TableCell>
									<TableCell>
										<SentimentSatisfiedAlt />
									</TableCell>
									<TableCell>
										<SentimentVeryDissatisfied />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</div>
		</>
	);
};

export default About;
