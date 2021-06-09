import { memo } from "react";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { MyServicesSavedConfig } from "./MyServicesSavedConfig";
import { useCallbackFactory } from "powerhooks";
import { Typography } from "onyxia-ui";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/theme";
import Link from "@material-ui/core/Link";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "entry": {
            "marginBottom": theme.spacing(1)
        },
        "wrapper": {
            "flex": 1,
            "overflow": "auto",
        }
    })
);

export type Props = {
    className?: string;
    isShortVariant: boolean;
    savedConfigs: {
        logoUrl?: string;
        friendlyName: string;
        /** acts as an id*/
        restoreConfigurationUrl: string;
    }[];
    callback(params: {
        restoreConfigurationUrl: string;
        action: "delete" | "copy link"
    }): void;
    onRequestToggleIsShortVariant(): void;
    maxConfigCountInShortVariant: number;
};

export const MyServicesSavedConfigs = memo(
    (props: Props) => {

        const {
            className, savedConfigs,
            isShortVariant, callback,
            onRequestToggleIsShortVariant,
            maxConfigCountInShortVariant
        } = props;

        const { classNames } = useClassNames({});

        const callbackFactory = useCallbackFactory(
            (
                [restoreConfigurationUrl]: [string],
                [action]: ["delete" | "copy link"]
            ) => callback({ restoreConfigurationUrl, action })
        );

        return (
            <div className={cx(classNames.root, className)}>
                <Header
                    isShortVariant={isShortVariant}
                    configCount={savedConfigs.length}
                    onRequestToggleIsShortVariant={onRequestToggleIsShortVariant}
                />
                <div className={classNames.wrapper}>
                    {
                        savedConfigs
                            .filter(isShortVariant ? ((...[, i]) => i < maxConfigCountInShortVariant) : () => true)
                            .map(({ logoUrl, friendlyName, restoreConfigurationUrl }) =>
                                <MyServicesSavedConfig
                                    key={restoreConfigurationUrl}
                                    className={classNames.entry}
                                    isShortVariant={isShortVariant}
                                    logoUrl={logoUrl}
                                    friendlyName={friendlyName}
                                    restoreConfigurationUrl={restoreConfigurationUrl}
                                    callback={callbackFactory(restoreConfigurationUrl)}
                                />
                            )
                    }
                </div>
            </div>
        );


    }
);

export declare namespace MyServicesSavedConfigs {

    export type I18nScheme = {
        saved: undefined;
        'show all': { n: string; };
    };

}

const { Header } = (() => {

    type Props = {
        className?: string;
        isShortVariant: boolean;
        onRequestToggleIsShortVariant(): void;
        configCount: number;
    };

    const { useClassNames } = createUseClassNames()(
        theme => ({
            "root": {
                "margin": theme.spacing(2, 0),
                "display": "flex",
                "alignItems": "center"
            },
            "chevron": {
                "paddingLeft": 0
            },
            "link": {
                "cursor": "pointer"
            }
        })
    );

    const Header = memo(
        (props: Props) => {
            const {
                className, isShortVariant,
                onRequestToggleIsShortVariant, configCount
            } = props

            const { classNames } = useClassNames({});

            const { t } = useTranslation("MyServicesSavedConfigs");

            return (
                <div className={cx(classNames.root, className)}>

                    {!isShortVariant &&
                        <IconButton
                            className={classNames.chevron}
                            fontSize="large"
                            id="chevronLeft"
                            onClick={onRequestToggleIsShortVariant}
                        />}
                    <Typography variant="h4">
                        {t("saved")}
                    </Typography>
                    <div style={{ "flex": "1" }} />
                    {isShortVariant &&
                        <Link
                            onClick={onRequestToggleIsShortVariant}
                            className={classNames.link}
                        >
                            {t("show all", { "n": `${configCount}` })}
                        </Link>
                    }
                </div>
            );
        }
    );

    return { Header };


})();
