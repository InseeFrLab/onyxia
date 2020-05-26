import { CloudshellConfiguration } from './CloudshellConfiguration';

export interface Region {
	id: string;
	name: string;
	type: string;
	publishDomain: string;
	namespacePrefix: string;
	marathonDnsSuffix?: string;
	cloudshell?: CloudshellConfiguration;
	location?: Location;
}

export interface Location {
	name: string;
	lat: number;
	long: number;
}
