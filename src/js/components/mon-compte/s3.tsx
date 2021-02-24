  
import {
	InputAdornment,
	Input,
	InputLabel,
	IconButton,
	FormControl,
} from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import * as clipboard from 'clipboard-polyfill';
import D from 'js/i18n';

interface Props {
	value: string;
	handleReset?: () => void;
}


const S3Field = ({ value, handleReset }:Props) => {
	if (!value) return null;
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
				fullWidth
				value={value}
				endAdornment={
					<InputAdornment position="end">
						<IconButton
							aria-label="rafraîchir le mot de passe"
							onClick={handleReset}
						>
							<AutorenewIcon />
						</IconButton>
						<IconButton
							aria-label="copier dans le presse papier"
							onClick={() => clipboard.writeText(value)}
						>
							<FileCopy />
						</IconButton>
					</InputAdornment>
				}
			/>
		</FormControl>
	);
};

export default S3Field;
