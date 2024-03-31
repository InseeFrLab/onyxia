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

    const { cx, classes, css, theme } = useStyles();

    const { t } = useTranslation({ TestS3ConnectionButton });

    return (
        <div className={cx(classes.root, className)}>
            <Button
                variant="ternary"
                onClick={onTestConnection}
                startIcon={id<MuiIconComponentName>("SettingsEthernet")}
                disabled={
                    onTestConnection === undefined || connectionTestStatus.isTestOngoing
                }
            >
                {t("test connection")}
            </Button>
            {(() => {
                if (connectionTestStatus.isTestOngoing) {
                    return <CircularProgress size={theme.spacing(4)} />;
                }

                switch (connectionTestStatus.stateDescription) {
                    case "not tested yet":
                        return null;
                    case "success":
                        return (
                            <Icon
                                className={cx(
                                    classes.icon,
                                    css({
                                        "color":
                                            theme.colors.useCases.alertSeverity.success
                                                .main
                                    })
                                )}
                                icon={id<MuiIconComponentName>("DoneOutline")}
                            />
                        );
                    case "failed":
                        return (
                            <>
                                <Tooltip
                                    title={t("test connection failed", {
                                        "errorMessage": connectionTestStatus.errorMessage
                                    })}
                                >
                                    <Icon
                                        className={css({
                                            "color":
                                                theme.colors.useCases.alertSeverity.error
                                                    .main
                                        })}
                                        icon={id<MuiIconComponentName>("ErrorOutline")}
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

const useStyles = tss.withName({ TestS3ConnectionButton }).create(({ theme }) => ({
    "root": {
        "display": "flex",
        "alignItems": "center",
        "gap": theme.spacing(3)
    },
    "icon": {
        "fontSize": "inherit",
        ...(() => {
            const factor = 1.6;
            return { "width": `${factor}em`, "height": `${factor}em` };
        })()
    }
}));

const { i18n } = declareComponentKeys<
    | "test connection"
    | {
          K: "test connection failed";
          P: { errorMessage: string };
          R: JSX.Element;
      }
>()({ TestS3ConnectionButton });
export type I18n = typeof i18n;
