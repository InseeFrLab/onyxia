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
    () => ({
        "root": {
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
                {
                    savedConfigs
                        .filter(isShortVariant ? ((...[, i]) => i < maxConfigCountInShortVariant) : () => true)
                        .map(({ logoUrl, friendlyName, restoreConfigurationUrl }) =>
                        <MyServicesSavedConfig
                            isShortVariant={isShortVariant}
                            logoUrl={logoUrl}
                            friendlyName={friendlyName}
                            restoreConfigurationUrl={restoreConfigurationUrl}
                            callback={callbackFactory(restoreConfigurationUrl)}
                        />
                    )
                }
            </div>
        );


    }
);

export declare namespace MyServicesSavedConfigs {

    export type I18nScheme = {
        saved: undefined;
        'show all': { n: number };
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
        () => ({
            "root": {
                "display": "flex",
                "alignItems": "center"
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
                            fontSize="large"
                            id="chevronLeft"
                            onClick={onRequestToggleIsShortVariant}
                        />}
                    <Typography variant="h4">
                        {t("saved")}
                    </Typography>
                    <div style={{ "display": "flex" }} />
                    {isShortVariant &&
                        <Link onClick={onRequestToggleIsShortVariant} >
                            {t("show all", { "n": configCount })}
                        </Link>}
                </div>
            );
        }
    );

    return { Header };


})();
