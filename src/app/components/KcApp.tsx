
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
            "background": `${theme.custom.colors.useCases.surfaces.background} !important`,
            "& body": {
                "background": `url(${(()=>{
                    switch(theme.palette.type){
                        case "dark": return onyxiaNeumorphismDarkModeUrl;
                        case "light": return onyxiaNeumorphismLightModeUrl;
                    }
                })()}) no-repeat center center fixed !important`
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

    const { classNames } = useClassNames({});


    return (
        <DefaultKcApp
            kcContext={kcContext}
            {...{
                ...defaultKcProps,
                "kcHtmlClass": [...defaultKcProps.kcHtmlClass, classNames.kcHtmlClass],
                "kcLoginClass": [...defaultKcProps.kcLoginClass, classNames.kcLoginClass],
            }}
        />
    );

}
