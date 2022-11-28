import Button from "@mui/material/Button";
import CopyableField from "js/components/commons/copyable-field";
import { objDiff, buildParamsFromObj } from "js/utils";
import D from "js/i18n";
import "./custom-service.scss";
import { useLocation } from "js/utils/reactRouterPolyfills";

type Props = {
    initialValues?: Record<string, string | boolean | number>;
    fieldsValues?: Record<string, string | boolean | number>;
    setInit?: () => void;
};

export const CustomService: React.FC<Props> = ({
    initialValues,
    fieldsValues,
    setInit
}) => {
    const { pathname } = useLocation();

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
