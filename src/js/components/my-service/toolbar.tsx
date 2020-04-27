import React from 'react';
import { Paper, Fab, Icon, Tooltip } from '@material-ui/core/';

interface Props {
	handleDelete?: () => void;
	handleRefresh?: () => void;
}

const Toolbar = ({ handleDelete, handleRefresh }: Props) => (
	<Paper className="onyxia-toolbar" elevation={1}>
		<Actions handleDelete={handleDelete} handleRefresh={handleRefresh} />
	</Paper>
);

const Actions = ({ handleDelete, handleRefresh }) => (
	<>
		{handleRefresh ? (
			<Tooltip title="Refresh">
				<Fab
					color="secondary"
					aria-label="refresh"
					classes={{ root: 'bouton' }}
					onClick={handleRefresh}
				>
					<Icon>refresh</Icon>
				</Fab>
			</Tooltip>
		) : (
			<></>
		)}

		{
			<>
				{handleDelete ? (
					<Tooltip title="Delete all">
						<Fab
							color="secondary"
							aria-label="deleteAll"
							classes={{ root: 'bouton' }}
							onClick={handleDelete}
						>
							<Icon>deleteAll</Icon>
						</Fab>
					</Tooltip>
				) : (
					<></>
				)}
			</>
		}
	</>
);

export default Toolbar;
