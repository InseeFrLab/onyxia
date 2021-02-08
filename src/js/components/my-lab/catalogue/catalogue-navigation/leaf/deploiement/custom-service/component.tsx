import React from 'react';
import Button from '@material-ui/core/Button';
import CopyableField from 'js/components/commons/copyable-field';
import { objDiff, buildParamsFromObj } from 'js/utils';
import D from 'js/i18n';
import './custom-service.scss';
import { withTypeRouteBasedImplementationOfwithRouter } from "js/utils/withTypeRouteBasedImplementationOfwithRouter";

type Props = {
	initialValues?: Record<string, string | boolean | number>;
	fieldsValues?: Record<string, string | boolean | number>;
	setInit?: () => void;
	location: Location;
};

const CustomService_: React.FC<Props> = ({
	initialValues,
	fieldsValues,
	setInit,
	location: { pathname }
}) => {

	if (!initialValues) return null;
	const deploymentRoute = `${window.location.origin}${pathname}`;
	const params = buildParamsFromObj(objDiff(fieldsValues)(initialValues));
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
					color="secondary"
					onClick={setInit}
				>
					{D.reinitConf}
				</Button>
			</div>
		</div>
	);

};

export const CustomService = withTypeRouteBasedImplementationOfwithRouter(
	CustomService_
) as unknown as React.FC<Omit<Props, "location">>;
