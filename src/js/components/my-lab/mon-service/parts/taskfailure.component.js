import React from 'react';
import { Paper, Typography } from '@material-ui/core/';
import { WarnIcon } from 'js/components/commons/icons';
import ReactTimeAgo from 'react-time-ago/tooltip';
import Titre from 'js/components/commons/titre';

const TaskFailure = ({ service, formatUrl }) => (
	<Paper className="paragraphe" elevation={1}>
		<Typography variant="h3" gutterBottom className="taskFailure">
			<WarnIcon width={60} height={60} /> <Titre titre="Tâche échouée" />{' '}
			<WarnIcon width={60} height={60} />
		</Typography>
		<Typography variant="h6" color="textPrimary" gutterBottom>
			Message :
		</Typography>
		<Typography
			variant="body2"
			color="textPrimary"
			display="inline"
			gutterBottom
		>
			{service.lastTaskFailure.message}
		</Typography>

		<Typography variant="h6" color="textPrimary" gutterBottom>
			Hôte :
		</Typography>
		<Typography variant="body2" color="textPrimary" gutterBottom>
			{formatUrl(service.lastTaskFailure.host)}
		</Typography>
		<Typography variant="h6" color="textPrimary" gutterBottom>
			Heure :
		</Typography>
		<Typography variant="body2" color="textPrimary" gutterBottom>
			<ReactTimeAgo
				date={new Date(service.lastTaskFailure.timestamp)}
				locale="fr"
			/>
		</Typography>
		<Typography variant="h6" color="textPrimary" gutterBottom>
			Version :
		</Typography>
		<Typography variant="body2" color="textPrimary" gutterBottom>
			<ReactTimeAgo
				date={new Date(service.lastTaskFailure.version)}
				locale="fr"
			/>
		</Typography>
	</Paper>
);

export default TaskFailure;
