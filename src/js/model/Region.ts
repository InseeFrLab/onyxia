import { CloudshellConfiguration } from './CloudshellConfiguration';

export interface Region {
	id: string;
	name: string;
	description?: string;
	services: Services;
	data: Data;
	location?: Location;
	auth?: Auth;
}

export interface Services {
	type: string;
	namespacePrefix: string;
	marathonDnsSuffix?: string;
	cloudshell?: CloudshellConfiguration;
	monitoring?: Monitoring;
}

export interface Monitoring {
	URLPattern: string;
}

export interface Expose {
	domain: string;
}

export interface Data {
	S3: S3Config;
}

export interface Auth {
	type: string;
}

export interface S3Config {
	URL: string;
	monitoring?: Monitoring;
}

export interface Location {
	name: string;
	lat: number;
	long: number;
}
