import React, { useState } from 'react';
import { FileCopy, Save } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';
import { saveAs } from 'file-saver';
import * as clipboard from 'clipboard-polyfill';
import D from 'js/i18n';

const CopyButton = ({ fileName, content }) => {
	const copy = () => {
		clipboard.writeText(content);
		return false;
	};
	return (
		<IconButton aria-label={D.btnSaveAsLabel} onClick={copy}>
			<FileCopy />
		</IconButton>
	);
};

const ExportFileButton = ({ fileName, content }) => {
	const save = () => {
		var blob = new Blob([content], {
			type: 'text/plain;charset=utf-8',
		});
		saveAs(blob, fileName);
		return false;
	};
	return (
		<IconButton aria-label={D.btnCopyLabel} onClick={save}>
			<Save />
		</IconButton>
	);
};

export { ExportFileButton, CopyButton };
