  
import PropTypes from 'prop-types';
import { Paper, Fab, Icon } from '@mui/material';

const Toolbar = ({ linkToParentPathProps, download, deleteFile }) => (
	<Paper className="onyxia-toolbar" elevation={1}>
		<Fab
			className="bouton"
			color="secondary"
			title="télécharger"
			onClick={download}
		>
			<Icon fontSize="small">cloud_download</Icon>
		</Fab>

		<a {...linkToParentPathProps}>
			<Fab
				className="bouton"
				color="secondary"
				title="supprimer"
				onClick={deleteFile}
			>
				<Icon fontSize="small">delete</Icon>
			</Fab>
		</a>
	</Paper>
);

Toolbar.propTypes = {
	linkToParentPathProps: PropTypes.object.isRequired,
	download: PropTypes.func.isRequired,
	deleteFile: PropTypes.func.isRequired,
};

export default Toolbar;
