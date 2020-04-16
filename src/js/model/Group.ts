import { Service } from './Service';

export interface Group {
	id: string;
	apps: Service[];
}
