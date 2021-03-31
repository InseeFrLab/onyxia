import { Region } from 'js/model/Region';
import { prOnyxiaApiClient } from "lib/setup";

export interface Configuration {
	regions: Region[];
	build: Build;
}

export interface Build {
	version: string;
	timestamp: number;
}

export const getConfiguration = async () => {
	return (await prOnyxiaApiClient).getConfigurations()
};
