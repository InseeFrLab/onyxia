import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getCoreSync } from "core";
import type { AiInitializationError } from "core/usecases/ai";
import { useEvt } from "evt/hooks";
import { same } from "evt/tools/inDepth/same";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { symToStr } from "tsafe/symToStr";
import { routes } from "ui/routes";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";

export const AiInitializationErrorDialog = memo(() => {
    const {
        evts: { evtAi }
    } = getCoreSync();

    const { t } = useTranslation({ AiInitializationErrorDialog });

    const { classes, cx, css, theme } = useStyles();

    const [errors, setErrors] = useState<AiInitializationError[]>([]);

    useEvt(ctx => {
        evtAi.attach(ctx, event => {
            if (event === undefined || event.action !== "display error") {
                return;
            }

            setErrors(errors =>
                errors.some(error => same(error, event.error))
                    ? errors
                    : [...errors, event.error]
            );
        });
    }, []);

    const close = () => setErrors([]);

    const accountAiTabLink = routes.account({ tabId: "ai" }).link;

    if (errors.length === 0) {
        return <Dialog isOpen={false} onClose={close} />;
    }

    const doesRequireAccountOnly = errors.every(error => error.kind === "no-account");

    return (
        <Dialog
            title={
                doesRequireAccountOnly
                    ? t("account required title")
                    : t("initialization error title")
            }
            body={
                <div className={classes.errorList}>
                    {errors.map((error, index) => {
                        const severity = getSeverity(error);

                        return (
                            <div key={index} className={classes.error}>
                                <Icon
                                    className={cx(
                                        classes.errorIcon,
                                        css({
                                            color: theme.colors.useCases.alertSeverity[
                                                severity
                                            ].main
                                        })
                                    )}
                                    icon={getIconUrlByName(iconNameBySeverity[severity])}
                                />
                                <div>
                                    <Text typo="body 2">
                                        {(() => {
                                            switch (error.kind) {
                                                case "config-restoration-failed":
                                                    return t("config restoration failed");
                                                case "initialization-failed":
                                                    return t("initialization failed");
                                                case "no-account":
                                                    return t("no account", {
                                                        providerName: error.providerName
                                                    });
                                                case "authentication-failed":
                                                    return t("authentication failed", {
                                                        providerName: error.providerName
                                                    });
                                                case "models-fetch-failed":
                                                    return t("models fetch failed", {
                                                        providerName: error.providerName
                                                    });
                                            }
                                        })()}
                                    </Text>
                                    {error.kind === "no-account" && (
                                        <Button
                                            className={classes.errorAction}
                                            variant="ternary"
                                            href={error.webUiUrl}
                                            doOpenNewTabIfHref={true}
                                        >
                                            {t("open provider", {
                                                providerName: error.providerName
                                            })}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            }
            buttons={
                <>
                    <Button
                        variant="ternary"
                        href={accountAiTabLink.href}
                        onClick={e => {
                            accountAiTabLink.onClick(e);
                            close();
                        }}
                    >
                        {t("manage ai settings")}
                    </Button>
                    <Button autoFocus onClick={close}>
                        {t("ok")}
                    </Button>
                </>
            }
            isOpen={true}
            onClose={close}
            showCloseButton
        />
    );
});

const iconNameBySeverity = {
    info: "InfoOutlined",
    warning: "WarningAmber",
    error: "ErrorOutline"
} as const;

function getSeverity(error: AiInitializationError): keyof typeof iconNameBySeverity {
    switch (error.kind) {
        case "no-account":
            return "info";
        case "config-restoration-failed":
        case "models-fetch-failed":
            return "warning";
        case "initialization-failed":
        case "authentication-failed":
            return "error";
    }
}

const useStyles = tss.withName({ AiInitializationErrorDialog }).create(({ theme }) => ({
    errorList: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    error: {
        display: "flex",
        gap: theme.spacing(3)
    },
    errorIcon: {
        flexShrink: 0
    },
    errorAction: {
        marginTop: theme.spacing(1),
        marginLeft: -theme.spacing(2)
    }
}));

AiInitializationErrorDialog.displayName = symToStr({
    AiInitializationErrorDialog
});

const { i18n } = declareComponentKeys<
    | "initialization error title"
    | "account required title"
    | "config restoration failed"
    | "initialization failed"
    | { K: "no account"; P: { providerName: string }; R: string }
    | { K: "authentication failed"; P: { providerName: string }; R: string }
    | { K: "models fetch failed"; P: { providerName: string }; R: string }
    | { K: "open provider"; P: { providerName: string }; R: string }
    | "manage ai settings"
    | "ok"
>()({ AiInitializationErrorDialog });
export type I18n = typeof i18n;
