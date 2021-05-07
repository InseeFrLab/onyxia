

import { useState, memo } from "react";
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
    serviceTitle: string;
    serviceImageUrl?: string;
    isBookmarked: boolean;
    onIsBookmarkedValueChange(isBookmarked: boolean): void;

    friendlyName: string;
    onFriendlyNameChange(friendlyName: string): void;

    onRequestLaunch(): void;
    onRequestCancel(): void;

    getIsValidFriendlyName: NonNullable<TextFieldProps["getIsValidValue"]>

    isLocked: boolean;

};

export const CatalogLauncherMainCard = memo((props: Props) => {

    const {
        className,
        serviceImageUrl,
        serviceTitle,
        isBookmarked,
        friendlyName,
        onIsBookmarkedValueChange,
        onFriendlyNameChange,
        onRequestLaunch,
        onRequestCancel,
        getIsValidFriendlyName,
        isLocked
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("CatalogLauncherMainCard");

    const onBookmarkIconButtonClick = useConstCallback(
        () => onIsBookmarkedValueChange(!isBookmarked)
    );

    const [isFriendlyNameBeingTypedValid, setIsFriendlyNameBeingTypedValid] = useState(true);

    const onValueBeingTypedChange = useConstCallback<TextFieldProps["onValueBeingTypedChange"]>(
        params => {

            setIsFriendlyNameBeingTypedValid(params.isValidValue);

            if (params.isValidValue) {
                onFriendlyNameChange(params.value);
            }

        }
    );

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                <Typography variant="h5" className={classNames.cardTitle}>{t("card title")}</Typography>
                <div style={{ "flex": 1 }} />
                <IconButton
                    type={isBookmarked ? "bookmarkBorder" : "bookmark"}
                    onClick={onBookmarkIconButtonClick}
                    disabled={isLocked && !isFriendlyNameBeingTypedValid}
                />
            </div>
            <div className={classNames.belowDivider}>


                <div className={classNames.avatarAndTitleWrapper}>

                    {serviceImageUrl !== undefined &&
                        <Avatar src={serviceImageUrl} />}
                    <Typography
                        variant="h5"
                        className={classNames.title}
                    >
                        {serviceTitle}
                    </Typography>
                </div>
                <div className={classNames.textFieldAndButtonWrapper}>

                    <TextField
                        disabled={isLocked}
                        label={t("friendly name")}
                        getIsValidValue={getIsValidFriendlyName}
                        defaultValue={friendlyName}
                        doOnlyValidateInputAfterFistFocusLost={false}
                        selectAllTextOnFocus={true}
                        inputProps_spellCheck={false}
                        onValueBeingTypedChange={onValueBeingTypedChange}
                    />

                    <div style={{ "flex": 1 }} />

                    <Button
                        disabled={isLocked}
                        color="secondary"
                        onClick={onRequestCancel}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={isLocked}
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
    };
}