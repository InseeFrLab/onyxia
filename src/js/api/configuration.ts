import { restApiPaths } from 'js/restApiPaths';
import { Region } from 'js/model/Region';
import { axiosPublic } from "js/utils/axios-config";
import { prStore } from "lib/setup";
import { actions as regionsActions } from "js/redux/regions";

export interface Configuration {
	regions: Region[];
	build: Build;
}

export interface Build {
	version: string;
	timestamp: number;
}

export const getConfiguration = async () => {

	const store= await prStore;

	return axiosPublic
		.get<Configuration>(restApiPaths.configuration)
		.then((resp) => {
			const configuration = (resp as unknown) as Configuration;
			store.dispatch(
				regionsActions.newRegions({ 
					"regions": configuration.regions 
				})
			);
			return configuration;
		});
};
