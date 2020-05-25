import { CloudshellConfiguration } from './CloudshellConfiguration';

export interface Region {
	regionId: string;
	type: 'MARATHON' | 'KUB';
	'publish-domain': string;
	'namespace-prefix': string;
	'marathon-dns-suffix'?: string;
	cloudshell?: CloudshellConfiguration;
}
