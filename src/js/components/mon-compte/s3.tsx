import React from 'react';
import {
	InputAdornment,
	Input,
	InputLabel,
	IconButton,
	FormControl,
} from '@material-ui/core';
import FileCopy from '@material-ui/icons/FileCopy';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIos from '@material-ui/icons/ArrowForwardIos';
import * as clipboard from 'clipboard-polyfill';
import D from 'js/i18n';

interface Props {
	value: string;
	handleReset: () => void;
	versionsList?: string[];
	onVersionChange?: (string) => void;
	currentVersion: number;
	minVersion: number;
	maxVersion: number;
}

const S3Field = ({
	value,
	handleReset,
	onVersionChange,
	currentVersion,
	maxVersion,
	minVersion,
}: Props) => {
	return (
		<FormControl className="copy-field" style={{ width: '100%' }}>
			<InputLabel>{D.pwdTitle}</InputLabel>
			<Input
				disabled
				fullWidth
				value={value}
				startAdornment={
					<InputAdornment position="start">
						Version {currentVersion} : 
					</InputAdornment>
				}
				endAdornment={
					<InputAdornment position="end">
						<IconButton
							disabled={Number(minVersion) === Number(currentVersion)}
							aria-label="previous password"
							onClick={() => onVersionChange((currentVersion - 1).toString())}
						>
							<ArrowBackIos />
						</IconButton>
						<IconButton
							disabled={Number(maxVersion) === Number(currentVersion)}
							aria-label="next password"
							onClick={() =>
								onVersionChange((Number(currentVersion) + 1).toString())
							}
						>
							<ArrowForwardIos />
						</IconButton>
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
