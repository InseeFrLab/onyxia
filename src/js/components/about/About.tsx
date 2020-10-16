import React, { useMemo } from 'react';
import Typography from '@material-ui/core/Typography';
import dayjs from 'dayjs';
import GitInfo from 'react-git-info/macro';
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import { getConfiguration } from 'js/api/configuration';
import SelectRegion from './SelectRegion';
import type { Region } from 'js/model/Region';
import CopyableField from '../commons/copyable-field';
import { actions as regionActions } from "js/redux/regions";
import { useDispatch, useSelector } from "js/redux/store";
import { useAsync } from "react-async-hook";

export const About = () => {

	//NOTE: We wrap the states in an object so we
	//can establish that !!configuration => !!regions
	const state = (function useClosure() {

		const regions = useSelector(({ regions }) => regions.regions);
		const selectedRegion = useSelector(({ regions }) => regions.selectedRegion);

		//NOTE: After getConfiguration we know for sure that
		//regions and selectedRegion are not undefined.
		const configuration = useAsync(getConfiguration, []).result;

		return {
			configuration,
			regions,
			selectedRegion,
		} as unknown as (
				{
					configuration: undefined;
				} |
				{
					configuration: NonNullable<typeof configuration>;
					regions: NonNullable<typeof regions>;
					selectedRegion: NonNullable<typeof selectedRegion>;
				}
			);

	})();

	const dispatch = useDispatch();

	const changeRegion = (newRegion: Region) =>
		dispatch(regionActions.regionChanged({ newRegion }));

	const gitInfo = GitInfo();

	const versionInterface = gitInfo.tags?.[0] ?? gitInfo.branch;

	const versionInterfaceDate = gitInfo.commit.date;

	const serverVersion = useMemo(
		() => !state.configuration ?
			"Loading server version..."
			:
			[
				state.configuration.build.version,
				" (",
				dayjs(state.configuration.build.timestamp * 1000).format(),
				")"
			].join(""),
		[state.configuration]
	);

	return (
		<>
			<div className="en-tete">
				<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
					A propos d'Onyxia
		</Typography>
			</div>
			<FilDAriane fil={fil.about} />
			<div className="contenu accueil">
				<CopyableField
					label="Interface version"
					value={`${versionInterface} (${versionInterfaceDate})`}
					copy
				/>
				<CopyableField label="Server version" value={serverVersion} copy />

				{!state.configuration ?
					<span>Fetching configuration</span> :
					<SelectRegion
						regions={state.regions}
						selectedRegion={state.selectedRegion.id}
						onRegionSelected={region => changeRegion(region)}
					/>}
			</div>
		</>
	);
};

