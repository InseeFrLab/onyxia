import apiPaths from 'js/configuration/api-paths';
import { Region } from 'js/model/Region';
import { axiosPublic } from 'js/utils';

export interface Configuration {
	regions: Region[];
	build: Build;
}

export interface Build {
	version: string;
}

export const getConfiguration = async () => {
	return await axiosPublic
		.get<Configuration>(apiPaths.configuration)
		.then((resp) => (resp as unknown) as Configuration);
};
