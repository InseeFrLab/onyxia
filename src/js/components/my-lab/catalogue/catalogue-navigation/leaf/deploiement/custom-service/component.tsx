import React from 'react';
import { withRouter } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import CopyableField from 'js/components/commons/copyable-field';
import { objDiff, buildParamsFromObj } from 'js/utils';
import D from 'js/i18n';
import './custom-service.scss';

interface Props {
	initialValues?: string;
	fieldsValues?: string;
	setInit?: () => void;
	location: { pathname: string };
}

const CustomService = ({
	initialValues,
	fieldsValues,
	setInit,
	location: { pathname },
}: Props) => {
	if (!initialValues) return null;
	const deploymentRoute = `${window.location.origin}${pathname}`;
	const params = buildParamsFromObj(objDiff(fieldsValues)(initialValues));
	console.log(objDiff(fieldsValues)(initialValues));
	return !params ? null : (
		<div className="custom-service">
			<CopyableField
				copy
				description={D.customServiceDescription}
				label={D.customServiceTitle}
				value={`${deploymentRoute}?${params}`}
			/>
			<div className="btn-reset">
				<Button
					id="reset-configuration"
					variant="contained"
					color="primary"
					onClick={setInit}
				>
					{D.reinitConf}
				</Button>
			</div>
		</div>
	);
};

export default withRouter(CustomService);
