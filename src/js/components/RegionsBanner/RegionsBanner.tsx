import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import { IconButton, Collapse, Grid, Paper } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Region } from 'js/model/Region';
import { getConfiguration } from 'js/api/configuration';
import { RootState } from 'js/redux/';

interface RegionsState {
	regions: Region[];
	selectedRegion?: Region;
}

interface Props {
	regions: RegionsState;
}

// const Selectedregions = (props: Props) => {
// 	const regions = props.regions;
// 	const dispatch = useDispatch();

// 	const changeRegion = (id: String) => {
// 		dispatch(
// 			regionChanged(regions.regions.filter((region) => region.id === id)[0])
// 		);
// 	};

// 	return regions && regions.selectedRegion ? (
// 		<Select
// 			labelId="demo-simple-select-label"
// 			id="demo-simple-select"
// 			value={regions.selectedRegion.id}
// 			onChange={(e) => changeRegion(e.target.value as String)}
// 		>
// 			{regions.regions.map((region) => (
// 				<MenuItem key={region.id} value={region.id}>
// 					{region.name}
// 				</MenuItem>
// 			))}
// 		</Select>
// 	) : (
// 		<></>
// 	);
// };

const RegionBanner = () => {
	const regions = useSelector((store: RootState) => store.regions);
	const [open, setOpen] = useState(true);

	useEffect(() => {
		if (!regions.selectedRegion) {
			getConfiguration().then();
		}
	}, [regions.selectedRegion]);

	return regions?.selectedRegion ? (
		<>
			<Collapse in={open}>
				<Alert variant="filled" severity="warning">
					<Grid
						container
						direction="row"
						justify="space-between"
						alignItems="flex-start"
					>
						<Grid item xs={6}>
							Vous déployez dans la région {regions.selectedRegion.name}
						</Grid>
						<Grid item xs={6}>
							Vous déployez dans la région {regions.selectedRegion.name}
						</Grid>
					</Grid>
				</Alert>
			</Collapse>
			<Grid
				container
				direction="row"
				justify="flex-end"
				alignItems="flex-start"
			>
				{!open ? (
					<IconButton
						aria-label="show"
						color="inherit"
						size="small"
						onClick={() => setOpen(true)}
					>
						<ExpandMoreIcon fontSize="inherit" />
					</IconButton>
				) : (
					<IconButton
						aria-label="show"
						color="inherit"
						size="small"
						onClick={() => setOpen(false)}
					>
						<ExpandLessIcon fontSize="inherit" />
					</IconButton>
				)}
			</Grid>
		</>
	) : (
		<></>
	);
};

export default RegionBanner;
