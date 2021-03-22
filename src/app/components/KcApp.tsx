
import { useEffect } from "react";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import onyxiaNeumorphismDarkModeUrl from "app/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "app/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { KcApp as DefaultKcApp, defaultKcProps } from "keycloakify";
import type { KcContext } from "keycloakify";
import { createUseClassNames } from "app/theme/useClassNames";

export type Params = {
    kcContext: KcContext;
};

const { useClassNames } = createUseClassNames()(
    theme=>({
        "kcLoginClass": {
            "& #kc-locale": {
                "zIndex": 5
            }
        },
        "kcHtmlClass": {
            "& body": {
                "background": `url(${(()=>{
                    switch(theme.palette.type){
                        case "dark": return onyxiaNeumorphismDarkModeUrl;
                        case "light": return onyxiaNeumorphismLightModeUrl;
                    }
                })()}) no-repeat center center fixed !important`,
                "fontFamily": theme.typography.fontFamily,
            },
            "background": `${theme.custom.colors.useCases.surfaces.background} !important`,
            "& a": {
                "color": `${theme.custom.colors.palette.exuberantOrange.main} !important`
            },
            "& #kc-current-locale-link": {
                "color": `${theme.custom.colors.palette.whiteSnow.greyVariant3} !important`
            },
            "& label": {
                "fontSize": 14,
                "color": theme.custom.colors.palette.whiteSnow.greyVariant3,
                "fontWeight": "normal"
            },
            "& #kc-page-title": theme.typography.h2 as any,
            "& #kc-header-wrapper": {
                "visibility": "hidden"
            }

        },
        "kcFormCardClass": {
            "borderRadius": 10
        },
        "kcButtonPrimaryClass": {
            "backgroundColor": "unset !important",
            "backgroundImage": "unset !important",
            "borderColor": `${theme.custom.colors.palette.exuberantOrange.main} !important`,
            "borderWidth": "2px !important",
            "borderRadius": `20px !important`,
            "color": `${theme.custom.colors.palette.exuberantOrange.main} !important`,
            "textTransform": "uppercase"

        },
        "kcInputClass": {
            "borderRadius": "unset !important",
            "border": "unset !important",
            "boxShadow": "unset !important",
            "borderBottom": `1px solid ${theme.custom.colors.useCases.typography.textDisabled} !important`,
            "&:focus": {
                "borderColor": `unset !important`,
                "borderBottom": `1px solid ${theme.custom.colors.useCases.typography.textFocus} !important`,
            }

        }
    })
);

export function KcApp(params: Params) {

    const { kcContext } = params;

    const { hideSplashScreen } = useSplashScreen();

    useEffect(
        () => { hideSplashScreen(); },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    /*
    useEffect(
        ()=> { console.log(JSON.stringify(defaultKcProps,null,2)); },
        []
    );
    */

    const { classNames } = useClassNames({});


    return (
        <DefaultKcApp
            kcContext={kcContext}
            {...{
                ...defaultKcProps,
                "kcHtmlClass": [...defaultKcProps.kcHtmlClass, classNames.kcHtmlClass],
                "kcLoginClass": [...defaultKcProps.kcLoginClass, classNames.kcLoginClass],
                "kcFormCardClass": [...defaultKcProps.kcFormCardClass, classNames.kcFormCardClass],
                "kcButtonPrimaryClass": [...defaultKcProps.kcButtonPrimaryClass, classNames.kcButtonPrimaryClass],
                "kcInputClass": [...defaultKcProps.kcInputClass, classNames.kcInputClass]
            }}
        />
    );

}
