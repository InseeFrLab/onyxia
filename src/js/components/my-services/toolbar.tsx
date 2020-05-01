import React, { useState } from 'react';
import { Paper, Fab, Icon, Tooltip } from '@material-ui/core/';
import { Link } from 'react-router-dom';
import Dialog from 'js/components/commons/dialog';
import D from 'js/i18n';

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
}: Props) => {
	const [dialog, setDialog] = useState(false);
	const wantDelete = () => {
		setDialog(true);
	};
	const onValid = () => {
		setDialog(false);
		handleDeleteAll();
	};
	const onCancel = () => {
		setDialog(false);
	};
	return (
		<Paper className="onyxia-toolbar" elevation={1}>
			<Actions
				hasService={hasService}
				handleDeleteAll={wantDelete}
				handlePauseAll={handlePauseAll}
				handleRefresh={handleRefresh}
			/>
			<Dialog
				open={dialog}
				title={D.myServicesDialogTitle}
				subtitle={D.myServicesDialogSubtitle}
				body={D.myServicesDialogBody}
				warn={D.myServicesDialogWarn}
				onValid={onValid}
				onCancel={onCancel}
			/>
		</Paper>
	);
};

const Actions = ({
	hasService,
	handleDeleteAll,
	handlePauseAll,
	handleRefresh,
}) => (
	<>
		{handleRefresh && (
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
				{handlePauseAll && (
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
				)}
				{handleDeleteAll && (
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
				)}
			</>
		)}
	</>
);

export default Toolbar;
