import { memo } from "react";
import { makeStyles } from "ui/theme";
import { RoundLogo } from "ui/components/shared/RoundLogo";
import { Button, Text } from "ui/theme";
import { useTranslation } from "ui/i18n";
import { IconButton } from "ui/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { Tooltip } from "onyxia-ui/Tooltip";
import { capitalize } from "tsafe/capitalize";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    packageName: string;
    packageIconUrl?: string;
    isBookmarked: boolean;
    onIsBookmarkedValueChange: (isBookmarked: boolean) => void;

    friendlyName: string;
    onFriendlyNameChange: (friendlyName: string) => void;

    isShared: boolean;
    onIsSharedValueChange: (params: { isShared: boolean }) => void;

    isLaunchable: boolean;

    onRequestLaunch: () => void;
    onRequestCancel: () => void;

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
        isShared,
        isLaunchable,
        onIsBookmarkedValueChange,
        onFriendlyNameChange,
        onIsSharedValueChange,
        onRequestLaunch,
        onRequestCancel,
        onRequestCopyLaunchUrl
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ CatalogLauncherMainCard });

    const onBookmarkIconButtonClick = useConstCallback(() =>
        onIsBookmarkedValueChange(!isBookmarked)
    );

    const onValueBeingTypedChange = useConstCallback<
        TextFieldProps["onValueBeingTypedChange"]
    >(({ value }) => onFriendlyNameChange(value));

    const onIsSharedCheckboxChange = useConstCallback(
        (event: React.ChangeEvent<HTMLInputElement>) =>
            onIsSharedValueChange({ "isShared": event.target.checked })
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <Text typo="object heading" className={classes.cardTitle}>
                    {t("card title")}
                </Text>
                <div style={{ "flex": 1 }} />

                {onRequestCopyLaunchUrl !== undefined && (
                    <Tooltip title={t("copy url helper text")}>
                        <IconButton iconId="link" onClick={onRequestCopyLaunchUrl} />
                    </Tooltip>
                )}
                <Tooltip title={t("save configuration")}>
                    <IconButton
                        iconId={isBookmarked ? "bookmark" : "bookmarkBorder"}
                        onClick={onBookmarkIconButtonClick}
                    />
                </Tooltip>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.logoAndTitleWrapper}>
                    {packageIconUrl !== undefined && (
                        <RoundLogo url={packageIconUrl} size="large" />
                    )}
                    <Text typo="object heading" className={classes.title}>
                        {capitalize(packageName)}
                    </Text>
                </div>
                <div className={classes.textFieldAndButtonWrapper}>
                    <TextField
                        label={t("friendly name")}
                        defaultValue={friendlyName}
                        doOnlyValidateInputAfterFistFocusLost={false}
                        selectAllTextOnFocus={true}
                        inputProps_spellCheck={false}
                        onValueBeingTypedChange={onValueBeingTypedChange}
                    />
                    <FormControl className={classes.isSharedWrapper}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    className={classes.isSharedCheckbox}
                                    color="primary"
                                    checked={isShared}
                                    onChange={onIsSharedCheckboxChange}
                                />
                            }
                            label={t("share the service")}
                        />
                        <FormHelperText className={classes.isSharedFormHelperText}>
                            {t("share the service - explain")}
                        </FormHelperText>
                    </FormControl>

                    <div style={{ "flex": 1 }} />
                    <Button variant="secondary" onClick={onRequestCancel}>
                        {t("cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onRequestLaunch}
                        className={classes.launchButton}
                        disabled={!isLaunchable}
                    >
                        {t("launch")}
                    </Button>
                </div>
            </div>
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "card title"
    | "cancel"
    | "launch"
    | "friendly name"
    | "copy url helper text"
    | "save configuration"
    | "share the service"
    | "share the service - explain"
>()({ CatalogLauncherMainCard });

const useStyles = makeStyles({ "name": { CatalogLauncherMainCard } })(theme => ({
    "root": {
        "borderRadius": 8,
        "boxShadow": theme.shadows[7],
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "display": "flex",
        "flexDirection": "column"
    },
    "aboveDivider": {
        "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "boxSizing": "border-box",
        "display": "flex"
    },
    "cardTitle": {
        "display": "flex",
        "alignItems": "center"
    },
    "belowDivider": {
        "padding": theme.spacing(4),
        "paddingLeft": theme.spacing(5),
        "paddingTop": theme.spacing(3),
        "flex": 1
    },
    "logoAndTitleWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    },
    "title": {
        "display": "flex",
        "alignItems": "center",
        "marginLeft": theme.spacing(3)
    },
    "textFieldAndButtonWrapper": {
        "display": "flex",
        "alignItems": "center"
    },
    "isSharedWrapper": {
        "marginLeft": theme.spacing(7)
    },
    "isSharedCheckbox": {
        "padding": theme.spacing(2)
    },
    "isSharedFormHelperText": {
        "marginLeft": 0
    },
    "launchButton": {
        "marginLeft": theme.spacing(2)
    }
}));
