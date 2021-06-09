import { useState, memo } from "react";
import { useCallbackFactory } from "powerhooks";
import { useConstCallback } from "powerhooks";
import { createUseClassNames } from "app/theme";
import MuiButton from "@material-ui/core/Button";
import type { ButtonProps as MuiButtonProps } from "@material-ui/core/Button";
import { Icon } from "app/theme";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { useTranslation } from "app/i18n/useTranslations";
import { Typography } from "onyxia-ui";

const actions = ["copy link", "delete"] as const;

export type SavedConfigurationAction = typeof actions[number];

export type Props = {
    callback(action: SavedConfigurationAction): void;
};


const { useClassNames } = createUseClassNames()(
    theme => ({
        "menu": {
            "& .Mui-selected": {
                "backgroundColor": theme.colors.useCases.surfaces.surface1
            },
            "& .MuiPaper-root": {
                "backgroundColor": theme.colors.useCases.surfaces.background,
                //"left": "0px !important",
            },
            "& a": {
                "color": theme.colors.useCases.typography.textPrimary
            },
        },
        "menuTypo": {
            "display": "flex",
            "alignItems": "center"
        },
        "button": {
            "minWidth": "unset"
        }
    })
);

export const MyServicesSavedConfigOptions = memo((props: Props) => {

    const { callback } = props;

    const { classNames } = useClassNames({});

    const [menuElement, setMenuElement] = useState<HTMLButtonElement | undefined>(undefined);

    const onOpenMenuClick = useConstCallback<MuiButtonProps["onClick"]>(
        event => setMenuElement(event.currentTarget)
    );

    const onMenuClose = useConstCallback(
        () => setMenuElement(undefined)
    );

    const onMenuItemClickFactory = useCallbackFactory(
        ([action]: [SavedConfigurationAction]) => {
            callback(action);
            onMenuClose();
        }
    );

    const { t } = useTranslation("MyServicesSavedConfigOptions");


    return (
        <>
            <MuiButton
                className={classNames.button}
                aria-owns={menuElement ? menuId : undefined}
                aria-haspopup="true"
                onClick={onOpenMenuClick}
                data-ga-event-category="header"
                data-ga-event-action="language"
            >
                <Icon id="moreVert" />
            </MuiButton>
            <Menu
                id={menuId}
                anchorEl={menuElement}
                open={menuElement !== undefined}
                className={classNames.menu}
                onClose={onMenuClose}
            >
                {
                    actions
                        .map(action => (
                            <MenuItem
                                component="a"
                                data-no-link="true"
                                key={action}
                                selected={false}
                                onClick={onMenuItemClickFactory(action)}
                            >
                                <Typography variant="body1" className={classNames.menuTypo}>
                                    <Icon id={(() => {
                                        switch (action) {
                                            case "copy link": return "link" as const;
                                            case "delete": return "bookmark" as const;
                                        }
                                    })()} />
                                    &nbsp;
                                    {t((() => {
                                        switch (action) {
                                            case "copy link": return "copy link" as const;
                                            case "delete": return "remove bookmark" as const;
                                        }
                                    })())}
                                </Typography>
                            </MenuItem>
                        ))}

            </Menu>
        </>
    );

});

export declare namespace MyServicesSavedConfigOptions {

    export type I18nScheme = {
        'remove bookmark': undefined;
        'copy link': undefined;
    };

}



const menuId = "saved-configurations";




