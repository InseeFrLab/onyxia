import { memo } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/components/designSystem/IconButton";
import { useCallbackFactory } from "powerhooks";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";

export type Props = {
    className?: string;
    state: "collapsed" | "form" | "contract"
    onStateChange(state: Props["state"]): void;
};

const { useClassNames } = createUseClassNames<{ state: Props["state"]; }>()(
    (theme, { state }) => ({
        "root": {
            "display": "flex",
            "padding": theme.spacing(1, 3),
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces
        },
        "expandIcon": {
            "& svg": {
                "transition": theme.transitions.create(
                    ["transform"],
                    { "duration": theme.transitions.duration.short }
                ),
                "transform": `rotate(${(() => {
                    switch (state) {
                        case "collapsed":
                            return 0;
                        case "contract":
                        case "form":
                            return "-180deg";
                    }
                })()})`,
            }
        },
        "codeIcon":{
            "& svg": {
                "color": (()=>{
                    switch(state){
                        case "form": 
                        case "collapsed": 
                            return undefined;
                        case "contract": 
                            return theme.custom.colors.useCases.buttons.actionActive
                    }
                })()
            }
        },
        "title": {
            "display": "flex",
            "alignItems": "center"
        }

    })
);

export const CatalogLauncherAdvancedConfigurationHeader = memo(
    (props: Props) => {

        const { className, state, onStateChange } = props;

        const { t } = useTranslation("CatalogLauncherAdvancedConfigurationHeader");

        const { classNames } = useClassNames({ state });

        const onClickFactory = useCallbackFactory(
            ([target]: ["expandIcon" | "code"]) => onStateChange((() => {
                switch (target) {
                    case "expandIcon":
                        switch (state) {
                            case "collapsed":
                                return "form";
                            case "contract":
                            case "form":
                                return "collapsed";
                        }
                        break;
                    case "code":
                        switch (state) {
                            case "collapsed":
                            case "form":
                                return "contract";
                            case "contract":
                                return "form";
                        }
                }
            })())
        );

        return (
            <div className={cx(classNames.root, className)}>
                <Typography
                    variant="h5"
                    className={classNames.title}
                >
                    {t("title")}
                </Typography>
                <div style={{ "flex": 1 }} />
                <IconButton
                    onClick={onClickFactory("code")}
                    type="code"
                    className={classNames.codeIcon}
                />
                <IconButton
                    onClick={onClickFactory("expandIcon")}
                    type="expandMore"
                    className={classNames.expandIcon}
                />
            </div>
        );

    }
);

export declare namespace CatalogLauncherAdvancedConfigurationHeader {

    export type I18nScheme = {
        title: undefined;
    };
}