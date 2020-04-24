import React from 'react';
import { Paper, Fab, Icon, Tooltip } from '@material-ui/core/';
import { Link } from 'react-router-dom';

interface Props {
	hasService: Boolean;
	handleDeleteAll?: () => void;
	handlePauseAll?: () => void;
	handleRefresh?: () => void;
}

const Toolbar = ({
	hasService,
	handleDeleteAll,
	handlePauseAll,
	handleRefresh,
}: Props) => (
	<Paper className="onyxia-toolbar" elevation={1}>
		<Actions
			hasService={hasService}
			handleDeleteAll={handleDeleteAll}
			handlePauseAll={handlePauseAll}
			handleRefresh={handleRefresh}
		/>
	</Paper>
);

const Actions = ({
	hasService,
	handleDeleteAll,
	handlePauseAll,
	handleRefresh,
}) => (
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

		<Link to="/my-lab/catalogue">
			<Tooltip title="New service">
				<Fab
					color="secondary"
					aria-label="New service"
					classes={{ root: 'bouton' }}
				>
					<Icon>add</Icon>
				</Fab>
			</Tooltip>
		</Link>

		{hasService && (
			<>
				{handlePauseAll ? (
					<Tooltip title="Stop all">
						<Fab
							color="secondary"
							aria-label="stop all"
							classes={{ root: 'bouton' }}
							onClick={handlePauseAll}
						>
							<Icon>pause</Icon>
						</Fab>
					</Tooltip>
				) : (
					<></>
				)}

				{handleDeleteAll ? (
					<Tooltip title="Delete all">
						<Fab
							color="secondary"
							aria-label="deleteAll"
							classes={{ root: 'bouton' }}
							onClick={handleDeleteAll}
						>
							<Icon>deleteAll</Icon>
						</Fab>
					</Tooltip>
				) : (
					<></>
				)}
			</>
		)}
	</>
);

export default Toolbar;
