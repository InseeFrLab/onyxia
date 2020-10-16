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
import './tasks.scss';

interface Props {
	serviceId: string;
	serviceType: string;
	tasks?: Task[];
}

const ServiceTasks = ({ serviceId, tasks }: Props) => {
	const [logs, setLogs] = useState<string>("");
	return (
		<>
			<Grid container spacing={2} classes={{ container: 'cartes' }}>
				{tasks!.map(({ id, status }) => {
					const content = status
						? `${status.status} ${status.reason ? `(${status.reason})` : ''}`
						: '';
					return (
						<Grid
							key={id}
							item
							lg={4}
							md={6}
							xs={12}
							classes={{ item: 'carte' }}
						>
							<Card>
								<CardHeader title={id} />
								<CardContent>{content}</CardContent>
								<CardActions>
									<IconButton
										aria-label="logs"
										onClick={() => getLogs(serviceId, id).then(setLogs)}
									>
										<DescriptionIcon />
									</IconButton>
								</CardActions>
							</Card>
						</Grid>
					);
				})}
			</Grid>
			{logs ? (
				<Paper elevation={3} className="tasks-log">
					{logs
						.split('\n')
						.map((l: string, i: number) => (
							<div key={`log-${i}`} className="log-content">
								{l}
							</div>
						))}
				</Paper>
			) : (
				<></>
			)}
		</>
	);
};

export default ServiceTasks;
