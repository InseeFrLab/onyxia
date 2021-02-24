import { Map, TileLayer, Marker } from 'react-leaflet';
import { useState } from 'react';
import './about.scss';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import {
	TableContainer,
	Paper,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Radio,
} from '@material-ui/core';
import { Region } from 'js/model/Region';
import {
	SentimentSatisfiedAlt,
	SentimentVeryDissatisfied,
} from '@material-ui/icons';

// Hack, see https://stackoverflow.com/a/56411961
// Without it, marker image is broken
//@ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
	iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
	iconUrl: require('leaflet/dist/images/marker-icon.png'),
	shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Props {
	regions: Region[];
	selectedRegion?: string;
	onRegionSelected?(region: Region): void;
}

const isSelected = (region: Region, selectedRegion: string) =>
	region.id === selectedRegion;
const hasGeolocationData = (region: Region) =>
	region.location?.long !== undefined && region.location?.lat !== undefined;

const SelectRegion = ({ regions, selectedRegion, onRegionSelected }: Props) => {
	const [location] = useState({
		lat: 48.8164,
		long: 2.3174,
		zoom: 4,
	});

	if (!regions || regions.length === 0) {
		return <></>;
	}

	const shouldDisplayMap = regions.filter(hasGeolocationData).length > 0;
	return (
		<>
			{shouldDisplayMap && (
				<Map center={[location.lat, location.long]} zoom={location.zoom}>
					<TileLayer
						attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
					/>
					{regions.filter(hasGeolocationData).map((region) => (
						<Marker
							//position={[region.location?.lat, region!?.location.long]}
							position={[region.location?.lat!,region.location?.long!]}
							opacity={isSelected(region, selectedRegion!) ? 1.0 : 0.5}
							key={region.id}
							onClick={() => onRegionSelected && onRegionSelected(region)}
						></Marker>
					))}
				</Map>
			)}

			<TableContainer component={Paper}>
				<Table aria-label="simple table">
					<TableHead>
						<TableRow>
							<TableCell></TableCell>
							<TableCell>Region</TableCell>
							<TableCell>Localisation</TableCell>
							<TableCell>Type</TableCell>
							<TableCell>Description</TableCell>
							<TableCell>Stockage</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{regions?.map((region) => (
							<TableRow
								key={region.id}
								selected={region.id === selectedRegion}
								onClick={() => onRegionSelected && onRegionSelected(region)}
							>
								<TableCell component="th" scope="row">
									<Radio
										checked={region.id === selectedRegion}
										onChange={() =>
											onRegionSelected && onRegionSelected(region)
										}
										value={region.id}
										inputProps={{ 'aria-label': region.id }}
									/>
								</TableCell>
								<TableCell>{region.name}</TableCell>
								<TableCell>{region?.location?.name || ''}</TableCell>
								<TableCell>{region.services.type}</TableCell>
								<TableCell>{region.description || ''}</TableCell>
								<TableCell>
									{region.data?.S3?.URL ? (
										<SentimentSatisfiedAlt />
									) : (
										<SentimentVeryDissatisfied />
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	);
};

export default SelectRegion;
