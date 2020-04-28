import React, { useState } from 'react';
import { Service } from 'js/model';
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
	service: Service;
}

const ServiceTasks = ({ service }: Props) => {
	const [logs, setLogs] = useState(undefined);

	return (
		<>
			<Grid container spacing={2} classes={{ container: 'cartes' }}>
				{service.tasks ? (
					service.tasks.map((task) => (
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
										getLogs(service.id, task.id, service.type).then(setLogs)
									}
								>
									<DescriptionIcon />
								</IconButton>
							</CardActions>
						</Card>
					))
				) : (
					<></>
				)}
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
