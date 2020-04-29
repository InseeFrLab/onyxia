import React, { useState } from 'react';
import { Paper, Fab, Icon, Tooltip } from '@material-ui/core/';
import Dialog from 'js/components/commons/dialog';
import D from 'js/i18n';

interface Props {
	handleDelete?: () => void;
	handleRefresh?: () => void;
}

const Toolbar = ({ handleDelete, handleRefresh }: Props) => {
	const [dialog, setDialog] = useState(false);
	const wantDelete = () => {
		setDialog(true);
	};
	const onValid = () => {
		handleDelete();
	};
	const onCancel = () => {
		setDialog(false);
	};
	return (
		<Paper className="onyxia-toolbar" elevation={1}>
			<Actions handleDelete={wantDelete} handleRefresh={handleRefresh} />
			<Dialog
				open={dialog}
				title={D.myServiceDialogTitle}
				subtitle={D.myServiceDialogSubtitle}
				body={D.myServiceDialogBody}
				warn={D.myServiceDialogWarn}
				onValid={onValid}
				onCancel={onCancel}
			/>
		</Paper>
	);
};

const Actions = ({ handleDelete, handleRefresh }) => (
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
		{handleDelete && (
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
		)}
	</>
);

export default Toolbar;
