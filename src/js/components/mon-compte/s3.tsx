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
import dayjs from 'dayjs';

interface Props {
	value: string;
	handleReset: () => void;
	versionsList?: string[];
	onVersionChange?: (string) => void;
	validityTime: string;
	currentVersion: number;
}

const formatageDate = (date) => dayjs(date).format('DD/MM/YYYY');

const S3Field = ({
	value,
	handleReset,
	onVersionChange,
	validityTime,
	currentVersion,
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
						{formatageDate(validityTime) + ' :'}
					</InputAdornment>
				}
				endAdornment={
					<InputAdornment position="end">
						<IconButton
							aria-label="previous password"
							onClick={() => onVersionChange((currentVersion - 1).toString())}
						>
							<ArrowBackIos />
						</IconButton>
						<IconButton
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

interface PropsSelect {
	versionsList: string[];
	onVersionChange?: (any) => void;
}

export default S3Field;
