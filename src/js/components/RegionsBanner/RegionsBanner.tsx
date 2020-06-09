import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import {
	IconButton,
	Collapse,
	MenuItem,
	Select,
	Grid,
} from '@material-ui/core';
import { regionChanged } from 'js/redux/actions';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Region } from 'js/model/Region';

interface RegionsState {
	regions: Region[];
	selectedRegion?: Region;
}

interface props {
	regions: RegionsState;
}

const Selectedregions = (props: props) => {
	const regions = props.regions;
	const dispatch = useDispatch();

	const changeRegion = (id: String) => {
		dispatch(
			regionChanged(regions.regions.filter((region) => region.id === id)[0])
		);
	};

	return regions && regions.selectedRegion ? (
		<Select
			labelId="demo-simple-select-label"
			id="demo-simple-select"
			value={regions.selectedRegion.id}
			onChange={(e) => changeRegion(e.target.value as String)}
		>
			{regions.regions.map((region) => (
				<MenuItem key={region.id} value={region.id}>
					{region.name}
				</MenuItem>
			))}
		</Select>
	) : (
		<></>
	);
};

const RegionBanner = () => {
	const regions = useSelector((store) => store.regions);
	const [open, setOpen] = useState(true);
	return regions && regions.selectedRegion ? (
		<>
			<Collapse in={open}>
				<Alert variant="filled" severity="warning">
					Vous déployez dans la région: <Selectedregions regions={regions} />
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
