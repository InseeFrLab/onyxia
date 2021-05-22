import { useEffect, useState, memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { routes } from "app/router";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import {
    CatalogLauncherConfigurationCard,
    Props as CatalogLauncherConfigurationCardProps
} from "./CatalogLauncherConfigurationCard";
import { useDispatch, useSelector } from "app/interfaceWithLib/hooks";
import { thunks, selectors } from "lib/useCases/launcher";
import { thunks as restorablePackageConfigsThunks } from "lib/useCases/restorablePackageConfigs";
import { useConstCallback } from "powerhooks";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "wrapperForScroll": {
            "height": "100%",
            "overflow": "auto",
            "& > *": {
                "marginBottom": theme.spacing(2)
            }
        }
    })
);

export const CatalogLauncher = memo((props: Props) => {

    const { className, route } = props;

    const dispatch = useDispatch();

    useEffect(
        () => {

            const {
                catalogId,
                packageName,
                p: formFieldsValueDifferentFromDefault
            } = route.params;

            dispatch(thunks.initialize({
                catalogId,
                packageName,
                formFieldsValueDifferentFromDefault
            }));

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route]
    );

    const restorablePackageConfig = useSelector(selectors.restorablePackageConfigSelector);

    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(
        () => {

            if (!restorablePackageConfig) {
                return;
            }

            setIsBookmarked(
                dispatch(
                    restorablePackageConfigsThunks.isRestorablePackageConfigInStore({
                        restorablePackageConfig
                    })
                )
            );

            const { catalogId, packageName, formFieldsValueDifferentFromDefault } = restorablePackageConfig;

            routes.catalogLauncher({
                catalogId,
                packageName,
                "p":
                    formFieldsValueDifferentFromDefault.length === 0 ?
                        undefined :
                        formFieldsValueDifferentFromDefault
            }).replace();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [restorablePackageConfig ?? Object]
    );

    const { classNames } = useClassNames({});

    const onRequestLaunch = useConstCallback(() =>
        dispatch(thunks.launch())
    );

    const onRequestCancel = useConstCallback(() =>
        routes.catalogExplorer({ "catalogId": route.params.catalogId }).push()
    );

    const onFormValueChange = useConstCallback<CatalogLauncherConfigurationCardProps["onFormValueChange"]>(
        ({ path, value }) => dispatch(thunks.changeFormFieldValue({ path, value }))
    );

    const onRequestCopyLaunchUrl = useConstCallback(
        () => copyToClipboard(window.location.href)
    );

    const onFriendlyNameChange = useConstCallback(
        (friendlyName: string) =>
            dispatch(thunks.changeFriendlyName(friendlyName))
    );

    const onIsBookmarkedValueChange = useConstCallback(
        (isBookmarked: boolean) => {
            assert(restorablePackageConfig !== undefined);
            dispatch(
                restorablePackageConfigsThunks[
                    isBookmarked ?
                        "saveRestorablePackageConfig" :
                        "deleteRestorablePackageConfig"
                ](
                    { restorablePackageConfig }
                )
            );
        }
    );

    const friendlyName = useSelector(selectors.friendlyNameSelector);

    const state = useSelector(state => state.launcher);

    const indexedFormFields = useSelector(selectors.indexedFormFieldsSelector);

    if (state.stateDescription !== "ready") {
        return null;
    }

    assert(restorablePackageConfig !== undefined);
    assert(indexedFormFields !== undefined);

    return (
        <div className={className}>
            <div className={classNames.wrapperForScroll}>

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
                        restorablePackageConfig.formFieldsValueDifferentFromDefault.length !== 0 ?
                            onRequestCopyLaunchUrl :
                            undefined
                    }
                />
                {
                    Object.keys(indexedFormFields!).map(
                        dependencyNamePackageNameOrGlobal =>
                            <CatalogLauncherConfigurationCard
                                key={dependencyNamePackageNameOrGlobal}
                                dependencyNamePackageNameOrGlobal={dependencyNamePackageNameOrGlobal}
                                formFieldsByTab={indexedFormFields[dependencyNamePackageNameOrGlobal]}
                                onFormValueChange={onFormValueChange}
                            />
                    )
                }

            </div>
        </div>
    );

});
