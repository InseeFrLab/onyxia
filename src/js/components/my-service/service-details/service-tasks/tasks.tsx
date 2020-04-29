import React, { useState } from 'react';
import { Task } from 'js/model/Task';
import {
	Card,
	CardHeader,
	Grid,
	CardContent,
	CardActions,
	IconButton,
	Paper,
} from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import { getLogs } from 'js/api/my-lab';

interface Props {
	serviceId: string;
	serviceType: string;
	tasks?: Task[];
}

const ServiceTasks = ({ serviceId, serviceType, tasks }: Props) => {
	const [logs, setLogs] = useState(undefined);
	return (
		<>
			<Grid container spacing={2} classes={{ container: 'cartes' }}>
				{tasks.map((task) => (
					<Card key={task.id}>
						<CardHeader title={task.id} />
						<CardContent>
							{task.status
								? `${task.status.status} (${task.status.reason})`
								: ''}
						</CardContent>
						<CardActions>
							<IconButton
								aria-label="logs"
								onClick={() =>
									getLogs(serviceId, task.id, serviceType).then(setLogs)
								}
							>
								<DescriptionIcon />
							</IconButton>
						</CardActions>
					</Card>
				))}
			</Grid>
			{logs ? (
				<Paper elevation={3}>
					<pre>{logs}</pre>
				</Paper>
			) : (
				<></>
			)}
		</>
	);
};

export default ServiceTasks;
