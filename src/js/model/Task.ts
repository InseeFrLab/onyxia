import { TaskStatus } from './TaskStatus';

export interface Task {
	id: string;
	status?: TaskStatus;
}
