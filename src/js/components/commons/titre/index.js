  
import CircularProgress from '@mui/material/CircularProgress';

const Titre = ({ titre, wait }) => (
	<>
		<span>{titre}</span>
		{wait ? (
			<span>
				<CircularProgress style={{ float: 'right' }} />
			</span>
		) : null}
	</>
);

export default Titre;
