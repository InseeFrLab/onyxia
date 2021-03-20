
import { KcApp as DefaultKcApp, defaultKcProps, } from "keycloakify";
import { KcContext } from "keycloakify";
import { createUseClassNames } from "app/theme/useClassNames";
import { useEffect } from "react";
import { useSplashScreen } from "app/components/shared/SplashScreen";

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
            "background": "unset !important",
            "& body": {
                "background": `${theme.custom.colors.useCases.surfaces.background} !important`,
            }
        }
    })
);

export function KcApp(params: Params) {

    const { kcContext } = params;

    //useState(()=> console.log("===>", JSON.stringify(kcContext, null, 2)));

    const { hideSplashScreen } = useSplashScreen();

    useEffect(
        () => { hideSplashScreen() },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { classNames } = useClassNames({});

    //console.log(JSON.stringify(defaultKcProps, null, 2));

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