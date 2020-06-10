import apiPaths from 'js/configuration/api-paths';
import { Region } from 'js/model/Region';
import { axiosPublic } from 'js/utils';
import store from 'js/redux/store';
import * as Actions from 'js/redux/actions';

export interface Configuration {
	regions: Region[];
	build: Build;
}

export interface Build {
	version: string;
	timestamp: number;
}

export const getConfiguration = async () => {
	return await axiosPublic
		.get<Configuration>(apiPaths.configuration)
		.then((resp) => {
			const configuration = (resp as unknown) as Configuration;
			store.dispatch(Actions.newRegions(configuration.regions));
			return configuration;
		});
};
