import { Button } from "onyxia-ui/Button";
import type { ConnectionTestStatus } from "core/usecases/s3ConfigManagement";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Icon } from "onyxia-ui/Icon";
import Tooltip from "@mui/material/Tooltip";
import { assert, type Equals } from "tsafe/assert";

export type Props = {
    className?: string;
    connectionTestStatus: ConnectionTestStatus;
    onTestConnection: (() => void) | undefined;
};

export function TestS3ConnectionButton(props: Props) {
    const { className, connectionTestStatus, onTestConnection } = props;

    const { cx, classes } = useStyles();

    const { t } = useTranslation({ TestS3ConnectionButton });

    return (
        <div className={cx(classes.root, className)}>
            <Button
                variant="secondary"
                onClick={onTestConnection}
                disabled={
                    onTestConnection === undefined || connectionTestStatus.isTestOngoing
                }
            >
                {t("test connection")}
            </Button>
            {(() => {
                if (connectionTestStatus.isTestOngoing) {
                    return <CircularProgress />;
                }

                switch (connectionTestStatus.stateDescription) {
                    case "not tested yet":
                        return null;
                    case "success":
                        return <Icon icon={id<MuiIconComponentName>("DoneOutline")} />;
                    case "failed":
                        return (
                            <>
                                <Icon icon={id<MuiIconComponentName>("ErrorOutline")} />
                                <Tooltip
                                    title={t("test connection failed", {
                                        "errorMessage": connectionTestStatus.errorMessage
                                    })}
                                >
                                    <Icon
                                        icon={id<MuiIconComponentName>("Help")}
                                        size="small"
                                    />
                                </Tooltip>
                            </>
                        );
                }
                assert<Equals<typeof connectionTestStatus, never>>(false);
            })()}
        </div>
    );
}

export const useStyles = tss.withName({ TestS3ConnectionButton }).create({
    "root": {}
});

export const { i18n } = declareComponentKeys<
    | "test connection"
    | {
          K: "test connection failed";
          P: { errorMessage: string };
          R: JSX.Element;
      }
>()({ TestS3ConnectionButton });
