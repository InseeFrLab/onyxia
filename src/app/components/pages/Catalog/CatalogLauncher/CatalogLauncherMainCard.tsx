

import { memo } from "react";
import { createUseClassNames } from "app/theme";
import Avatar from "@material-ui/core/Avatar";
import { Typography } from "onyxia-ui";
import { Button } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";
import { IconButton } from "app/theme";
import { useConstCallback } from "powerhooks";
import { TextField } from "onyxia-ui";
import type { TextFieldProps } from "onyxia-ui";
import { Tooltip } from "onyxia-ui";
import { capitalize } from "app/tools/capitalize";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.shadows[7],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "boxSizing": "border-box",
            "display": "flex"
        },
        "cardTitle": {
            "display": "flex",
            "alignItems": "center"
        },

        "belowDivider": {
            "padding": theme.spacing(3),
            "paddingLeft": theme.spacing(4),
            "paddingTop": theme.spacing(2),
            "flex": 1
        },
        "avatarAndTitleWrapper": {
            "display": "flex",
            "marginBottom": theme.spacing(2)
        },
        "title": {
            "display": "flex",
            "alignItems": "center",
            "marginLeft": theme.spacing(2)
        },

        "textFieldAndButtonWrapper": {
            "display": "flex",
            "alignItems": "center"
        },

        "bellowDividerLeft": {
            "flex": 1
        },
        "bellowDividerRight": {
            "display": "flex",
            "alignItems": "flex-end"
        },
        "launchButton": {
            "marginLeft": theme.spacing(1)
        }

    })
);

export type Props = {
    className?: string;
    packageName: string;
    packageIconUrl?: string;
    isBookmarked: boolean;
    onIsBookmarkedValueChange(isBookmarked: boolean): void;

    friendlyName: string;
    onFriendlyNameChange(friendlyName: string): void;

    onRequestLaunch(): void;
    onRequestCancel(): void;

    //Undefined when the configuration is the default one
    onRequestCopyLaunchUrl: (() => void) | undefined;
};

export const CatalogLauncherMainCard = memo((props: Props) => {

    const {
        className,
        packageIconUrl,
        packageName,
        isBookmarked,
        friendlyName,
        onIsBookmarkedValueChange,
        onFriendlyNameChange,
        onRequestLaunch,
        onRequestCancel,
        onRequestCopyLaunchUrl
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("CatalogLauncherMainCard");

    const onBookmarkIconButtonClick = useConstCallback(
        () => onIsBookmarkedValueChange(!isBookmarked)
    );

    const onValueBeingTypedChange = useConstCallback<TextFieldProps["onValueBeingTypedChange"]>(
        ({ value }) => onFriendlyNameChange(value)
    );

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                <Typography variant="h5" className={classNames.cardTitle}>{t("card title")}</Typography>
                <div style={{ "flex": 1 }} />

                {onRequestCopyLaunchUrl !== undefined &&
                    <Tooltip title={t("copy url helper text")}>
                        <IconButton
                            id="link"
                            onClick={onRequestCopyLaunchUrl}
                        />
                    </Tooltip>}
                <Tooltip title={t("save configuration")}>
                    <IconButton
                        id={isBookmarked ? "bookmark" : "bookmarkBorder"}
                        onClick={onBookmarkIconButtonClick}
                    />
                </Tooltip>
            </div>
            <div className={classNames.belowDivider}>
                <div className={classNames.avatarAndTitleWrapper}>
                    {packageIconUrl !== undefined &&
                        <Avatar src={packageIconUrl} />}
                    <Typography
                        variant="h5"
                        className={classNames.title}
                    >
                        {capitalize(packageName)}
                    </Typography>
                </div>
                <div className={classNames.textFieldAndButtonWrapper}>

                    <TextField
                        label={t("friendly name")}
                        defaultValue={friendlyName}
                        doOnlyValidateInputAfterFistFocusLost={false}
                        selectAllTextOnFocus={true}
                        inputProps_spellCheck={false}
                        onValueBeingTypedChange={onValueBeingTypedChange}
                    />

                    <div style={{ "flex": 1 }} />

                    <Button
                        color="secondary"
                        onClick={onRequestCancel}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        color="primary"
                        onClick={onRequestLaunch}
                        className={classNames.launchButton}
                    >
                        {t("launch")}
                    </Button>
                </div>
            </div>
        </div>
    );

});

export declare namespace CatalogLauncherMainCard {

    export type I18nScheme = {
        'card title': undefined;
        cancel: undefined;
        launch: undefined
        'friendly name': undefined;
        'copy url helper text': undefined;
        'save configuration': undefined;
    };
}