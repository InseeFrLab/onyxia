

import { memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import Avatar from "@material-ui/core/Avatar";
import { Typography } from "app/components/designSystem/Typography";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";
import { IconButton } from "app/components/designSystem/IconButton";
import { useConstCallback } from "powerhooks";
import { TextField } from "app/components/designSystem/TextField";
import type { TextFieldProps } from "app/components/designSystem/TextField";
import { Tooltip } from "app/components/designSystem/Tooltip";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.custom.shadows[7],
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.custom.colors.palette.whiteSnow.greyVariant1}`,
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
                <Tooltip title={t("copy url helper text")}>
                    <IconButton
                        type="link"
                        onClick={onRequestCopyLaunchUrl}
                        disabled={onRequestCopyLaunchUrl === undefined}
                    />
                </Tooltip>
                <IconButton
                    type={isBookmarked ? "bookmarkBorder" : "bookmark"}
                    onClick={onBookmarkIconButtonClick}
                />
            </div>
            <div className={classNames.belowDivider}>


                <div className={classNames.avatarAndTitleWrapper}>

                    {packageIconUrl !== undefined &&
                        <Avatar src={packageIconUrl} />}
                    <Typography
                        variant="h5"
                        className={classNames.title}
                    >
                        {packageName}
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
    };
}