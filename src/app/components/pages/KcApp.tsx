
import { KcApp as DefaultKcApp, defaultKcProps, } from "keycloakify";
import { KcContext } from "keycloakify";
import { css } from "tss-react";
import { useEffect } from "react";
import { useSplashScreen } from "app/components/shared/SplashScreen";

export type Params = {
    kcContext: KcContext;
};

export function KcApp(params: Params) {

    const { kcContext } = params;

    console.log(JSON.stringify(kcContext, null, 2));

    const { hideSplashScreen } = useSplashScreen();

    useEffect(
        () => hideSplashScreen(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <DefaultKcApp
            kcContext={kcContext}
            {...{
                ...defaultKcProps,
                "kcHeaderWrapperClass": css({ "color": "red" })
            }}
        />
    );

}