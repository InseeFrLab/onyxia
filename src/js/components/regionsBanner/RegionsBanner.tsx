import React, { useState, useEffect } from 'react';
import Alert from '@material-ui/lab/Alert';
import {
	IconButton,
	Collapse,
	Grid,
	Button,
	Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { getConfiguration } from 'js/api/configuration';
import { useHistory } from 'react-router-dom';
import { useSelector, useIsBetaModeEnabled } from "js/redux/hooks";

const RegionBanner = () => {
	const regions = useSelector(store => store.regions);
	const [open, setOpen] = useState(true);
	const history = useHistory();
	const { isBetaModeEnabled } = useIsBetaModeEnabled();
	useEffect(() => {
		if (!regions.selectedRegion) {
			getConfiguration();
		}
	}, [regions.selectedRegion]);

	return regions?.selectedRegion && (regions?.regions?.length ?? 0) > 1 && isBetaModeEnabled ? (
		<>
			<Collapse in={open}>
				<Alert
					variant="filled"
					severity="success"
					action={
						<Button
							aria-label="a-propos"
							color="inherit"
							size="small"
							onClick={() => history.push('/about')}
						>
							Changer
						</Button>
					}
				>
					<Typography>
						Vous déployez dans la région {regions.selectedRegion.name}
					</Typography>
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
