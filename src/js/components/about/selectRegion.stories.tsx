import { useState } from "react";
import SelectRegion from "./SelectRegion";
import { basicRegion } from "js/model/sampledata/region-basic";
import { regionWithLocation } from "js/model/sampledata/region-with-location";
import { regionWithLocation2 } from "js/model/sampledata/region-with-location2";

export default {
    title: "Select region",
    component: SelectRegion,
    includeStories: [],
};

export const NoRegions = () => <SelectRegion regions={[]} />;

NoRegions.story = {
    title: "No regions",
};

export const WithoutLocation = () => (
    <SelectRegion selectedRegion={basicRegion.id} regions={[basicRegion]} />
);

WithoutLocation.story = {
    title: "Without location",
};

export const WithLocation = () => (
    <SelectRegion
        selectedRegion={regionWithLocation2.id}
        regions={[regionWithLocation, regionWithLocation2]}
    />
);

WithLocation.story = {
    title: "With location",
};

export const WithEvent = () => {
    const [selectedRegion, setSelectedRegion] = useState(regionWithLocation2.id);
    return (
        <SelectRegion
            selectedRegion={selectedRegion}
            regions={[regionWithLocation, regionWithLocation2]}
            onRegionSelected={region => setSelectedRegion(region.id)}
        />
    );
};

WithEvent.story = {
    title: "With event",
};
