import { Button } from "onyxia-ui/Button";
import type { S3Profile } from "core/usecases/_s3Next/s3ProfilesManagement";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { getIconUrlByName } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import Tooltip from "@mui/material/Tooltip";
import { assert, type Equals } from "tsafe/assert";

export type Props = {
    className?: string;
    credentialsTestStatus: S3Profile.CreatedByUser["credentialsTestStatus"];
    onTestConnection: (() => void) | undefined;
};

export function TestS3ConnectionButton(props: Props) {
    const { className, credentialsTestStatus, onTestConnection } = props;

    const { cx, classes, css, theme } = useStyles();

    const { t } = useTranslation({ TestS3ConnectionButton });

    return (
        <div className={cx(classes.root, className)}>
            <Button
                variant="ternary"
                onClick={() => {
                    assert(onTestConnection !== undefined);
                    onTestConnection();
                }}
                startIcon={getIconUrlByName("SettingsEthernet")}
                disabled={
                    onTestConnection === undefined ||
                    credentialsTestStatus.status === "test ongoing"
                }
            >
                {t("test connection")}
            </Button>
            {(() => {
                if (credentialsTestStatus.status === "test ongoing") {
                    return <CircularProgress size={theme.spacing(4)} />;
                }

                switch (credentialsTestStatus.status) {
                    case "not tested":
                        return null;
                    case "test succeeded":
                        return (
                            <Icon
                                className={cx(
                                    classes.icon,
                                    css({
                                        color: theme.colors.useCases.alertSeverity.success
                                            .main
                                    })
                                )}
                                icon={getIconUrlByName("DoneOutline")}
                            />
                        );
                    case "test failed":
                        return (
                            <>
                                <Tooltip
                                    title={t("test connection failed", {
                                        errorMessage: credentialsTestStatus.errorMessage
                                    })}
                                >
                                    <Icon
                                        className={css({
                                            color: theme.colors.useCases.alertSeverity
                                                .error.main
                                        })}
                                        icon={getIconUrlByName("ErrorOutline")}
                                    />
                                </Tooltip>
                            </>
                        );
                }
                assert<Equals<typeof credentialsTestStatus, never>>(false);
            })()}
        </div>
    );
}

const useStyles = tss.withName({ TestS3ConnectionButton }).create(({ theme }) => ({
    root: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3)
    },
    icon: {
        fontSize: "inherit",
        ...(() => {
            const factor = 1.6;
            return { width: `${factor}em`, height: `${factor}em` };
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
