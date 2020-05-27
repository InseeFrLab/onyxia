import { Map, TileLayer, Marker } from 'react-leaflet';
import React, { useState } from 'react';
import './about.scss';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { Select, MenuItem } from '@material-ui/core';
import { Region } from 'js/model/Region';

// Hack, see https://stackoverflow.com/a/56411961
// Without it, marker image is broken
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
							position={[region.location.lat, region.location.long]}
							opacity={isSelected(region, selectedRegion) ? 1.0 : 0.5}
							key={region.id}
							onClick={() => onRegionSelected && onRegionSelected(region)}
						>
							{/*<Popup>
								{region.name}
								{!isSelected(region, selectedRegion) && (
									<Button
										onClick={() => onRegionSelected && onRegionSelected(region)}
									>
										Choisir
									</Button>
								)}
							</Popup>*/}
						</Marker>
					))}
				</Map>
			)}

			<Select
				value={selectedRegion || ''}
				onChange={(event) =>
					onRegionSelected &&
					onRegionSelected(
						regions.filter((region) => region.id === event.target.value)[0]
					)
				}
			>
				{regions.map((region) => (
					<MenuItem value={region.id} key={region.id}>
						{`${region.name} ${region.location?.name || ''}`}
					</MenuItem>
				))}
			</Select>
		</>
	);
};

export default SelectRegion;
