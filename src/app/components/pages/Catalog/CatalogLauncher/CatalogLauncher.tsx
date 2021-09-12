/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, memo } from "react";
import type { RefObject } from "react";
import { makeStyles } from "app/theme";
import { routes } from "app/routes/router";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import {
    CatalogLauncherConfigurationCard,
    Props as CatalogLauncherConfigurationCardProps,
} from "./CatalogLauncherConfigurationCard";
import { useDispatch, useSelector } from "app/interfaceWithLib/hooks";
import { thunks, selectors } from "lib/useCases/launcher";
import {
    thunks as restorablePackageConfigsThunks,
    pure as restorablePackageConfigsPure,
} from "lib/useCases/restorablePackageConfigs";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { assert } from "tsafe/assert";
import { useSplashScreen } from "onyxia-ui";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

const useStyles = makeStyles()(theme => ({
    "wrapperForScroll": {
        "height": "100%",
        "overflow": "auto",
    },
    "wrapperForMawWidth": {
        "maxWidth": 1200,
        "& > *": {
            "marginBottom": theme.spacing(3),
        },
    },
}));

export const CatalogLauncher = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const dispatch = useDispatch();

    useEffect(() => {
        const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
            route.params;

        dispatch(
            thunks.initialize({
                catalogId,
                packageName,
                formFieldsValueDifferentFromDefault,
            }),
        );

        return () => dispatch(thunks.reset());
    }, []);

    const restorablePackageConfig = useSelector(
        selectors.restorablePackageConfigSelector,
    );

    useEffect(() => {
        if (restorablePackageConfig === undefined) {
            return;
        }

        const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
            restorablePackageConfig;

        routes
            .catalogLauncher({
                catalogId,
                packageName,
                formFieldsValueDifferentFromDefault,
            })
            .replace();
    }, [restorablePackageConfig ?? Object]);

    const restorablePackageConfigs = useSelector(
        state => state.restorablePackageConfig.restorablePackageConfigs,
    );

    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        if (restorablePackageConfig === undefined) {
            return;
        }

        setIsBookmarked(
            restorablePackageConfigsPure.isRestorablePackageConfigInStore({
                restorablePackageConfigs,
                restorablePackageConfig,
            }),
        );
    }, [restorablePackageConfigs, restorablePackageConfig]);

    const { classes, cx } = useStyles();

    const onRequestLaunch = useConstCallback(() => dispatch(thunks.launch()));

    const onRequestCancel = useConstCallback(() =>
        routes.catalogExplorer({ "catalogId": route.params.catalogId }).push(),
    );

    const onFormValueChange = useConstCallback<
        CatalogLauncherConfigurationCardProps["onFormValueChange"]
    >(({ path, value }) => dispatch(thunks.changeFormFieldValue({ path, value })));

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        copyToClipboard(window.location.href),
    );

    const onFriendlyNameChange = useConstCallback((friendlyName: string) =>
        dispatch(thunks.changeFriendlyName(friendlyName)),
    );

    const onIsBookmarkedValueChange = useConstCallback((isBookmarked: boolean) => {
        assert(restorablePackageConfig !== undefined);
        dispatch(
            restorablePackageConfigsThunks[
                isBookmarked
                    ? "saveRestorablePackageConfig"
                    : "deleteRestorablePackageConfig"
            ]({ restorablePackageConfig }),
        );
    });

    const friendlyName = useSelector(selectors.friendlyNameSelector);

    const state = useSelector(state => state.launcher);

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        switch (state.stateDescription) {
            case "not initialized":
                showSplashScreen({ "enableTransparency": true });
                break;
            case "ready":
                switch (state.launchState) {
                    case "not launching":
                        if (route.params.autoLaunch) {
                            onRequestLaunch();
                        }
                        hideSplashScreen();
                        break;
                    case "launching":
                        showSplashScreen({ "enableTransparency": true });
                        break;
                    case "launched":
                        hideSplashScreen();
                        routes.myServices().push();
                        break;
                }
                break;
        }
    }, [
        state.stateDescription === "not initialized"
            ? state.stateDescription
            : state.launchState,
    ]);

    const indexedFormFields = useSelector(selectors.indexedFormFieldsSelector);
    const isLaunchable = useSelector(selectors.isLaunchableSelector);

    if (state.stateDescription !== "ready") {
        return null;
    }

    assert(restorablePackageConfig !== undefined);
    assert(indexedFormFields !== undefined);
    assert(isLaunchable !== undefined);

    return (
        <div className={cx(classes.wrapperForScroll, className)} ref={scrollableDivRef}>
            <div className={classes.wrapperForMawWidth}>
                <CatalogLauncherMainCard
                    packageName={state.packageName}
                    packageIconUrl={state.icon}
                    isBookmarked={isBookmarked}
                    onIsBookmarkedValueChange={onIsBookmarkedValueChange}
                    friendlyName={friendlyName!}
                    onFriendlyNameChange={onFriendlyNameChange}
                    onRequestLaunch={onRequestLaunch}
                    onRequestCancel={onRequestCancel}
                    onRequestCopyLaunchUrl={
                        restorablePackageConfig.formFieldsValueDifferentFromDefault
                            .length !== 0
                            ? onRequestCopyLaunchUrl
                            : undefined
                    }
                    isLaunchable={isLaunchable}
                />
                {Object.keys(indexedFormFields).map(dependencyNamePackageNameOrGlobal => (
                    <CatalogLauncherConfigurationCard
                        key={dependencyNamePackageNameOrGlobal}
                        dependencyNamePackageNameOrGlobal={
                            dependencyNamePackageNameOrGlobal
                        }
                        {...indexedFormFields[dependencyNamePackageNameOrGlobal]}
                        onFormValueChange={onFormValueChange}
                    />
                ))}
            </div>
        </div>
    );
});
