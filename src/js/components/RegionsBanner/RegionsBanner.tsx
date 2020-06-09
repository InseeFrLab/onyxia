import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import {
	IconButton,
	Collapse,
	Button,
	MenuItem,
	Select,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { regionChanged } from 'js/redux/actions';

const Selectedregions = (props) => {
	const regions = props.regions;
	const dispatch = useDispatch();
	const changeRegion = (id) => {
		dispatch(
			regionChanged(regions.regions.filter((region) => region.id === id)[0])
		);
	};

	return regions && regions.selectedRegion ? (
		<Select
			labelId="demo-simple-select-label"
			id="demo-simple-select"
			value={regions.selectedRegion.id}
			onChange={(e) => changeRegion(e.target.value)}
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
				<Alert
					variant="filled"
					severity="warning"
					action={
						<IconButton
							aria-label="close"
							color="inherit"
							size="small"
							onClick={() => setOpen(false)}
						>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					}
				>
					Vous déployez dans la région: <Selectedregions regions={regions} />
				</Alert>
			</Collapse>
			<Button disabled={open} variant="outlined" onClick={() => setOpen(true)}>
				Changer régions
			</Button>
		</>
	) : (
		<></>
	);
};

export default RegionBanner;
