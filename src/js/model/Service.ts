export interface Service {
	id: string;
	cpus: number;
	mem: number;
	instances: number;
	urls: Array<string>;
	labels: {
		ONYXIA_PRIVATE_ENDPOINT?: string;
		ONYXIA_SUBTITLE?: string;
	};
	logo?: string;
	name: string;
	subtitle?: string;
	startedAt?: number;
	status: string;
	type: string;
}

export enum ServiceType {
	Marathon = 'MARATHON',
	Kubernetes = 'KUBERNETES',
}

export enum ServiceStatus {
	Deploying = 'DEPLOYING',
	Running = 'RUNNING',
	Stopped = 'STOPPED',
}
