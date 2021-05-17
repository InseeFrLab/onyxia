import { useMemo, useEffect, memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { routes } from "app/router";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import {
    CatalogLauncherConfigurationCard,
    Props as CatalogLauncherConfigurationCardProps
} from "./CatalogLauncherConfigurationCard";
import { useDispatch, useSelector } from "app/interfaceWithLib/hooks";
import { thunks } from "lib/useCases/launcher";
import { useConstCallback } from "powerhooks";
import { cx } from "tss-react";
import { copyToClipboard } from "app/tools/copyToClipboard";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
};

const { useClassNames } = createUseClassNames()(
    () => ({
        "root": {
        }
    })
);

export const CatalogLauncher = memo((props: Props) => {

    const { className, route } = props;

    const dispatch = useDispatch();

    const launcherState = useSelector(state => state.launcher);

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

    useEffect(
        () => {

            if( launcherState === null ){
                return;
            }

            routes.catalogLauncher({
                "catalogId": route.params.catalogId,
                "packageName": route.params.packageName,
                "p": launcherState?.formFieldsValueDifferentFromDefault
            }).replace();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [launcherState?.formFieldsValueDifferentFromDefault ?? Object]
    );

    const { classNames } = useClassNames({});

    const onRequestLaunch = useConstCallback(() =>
        dispatch(thunks.launch())
    );

    const onRequestCancel = useConstCallback(() =>
        routes.catalogExplorer({ "catalogId": route.params.catalogId }).push()
    );

    const { formFieldsByTab } = useMemo(
        () => {

            const formFieldsByTab: CatalogLauncherConfigurationCardProps["formFieldsByTab"] = {};

            if (launcherState !== null) {

                launcherState.formFields.forEach(({ path, ...formField }) =>
                    (formFieldsByTab[path[0]] ??= []).push({
                        "path": path,
                        "title": formField.title ?? path.slice(1).join("."),
                        "description": formField.description,
                        "value": formField.value,
                        "isReadonly": formField.isReadonly,
                        "enum": formField.enum
                    })
                );

            }

            return { formFieldsByTab };

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [launcherState?.formFields ?? Object]
    );

    const onFormValueChange = useConstCallback<CatalogLauncherConfigurationCardProps["onFormValueChange"]>(
        ({ path, value }) => dispatch(thunks.changeFormFieldValue({ path, value }))
    );

    const previewContract = useConstCallback(
        () => dispatch(thunks.previewContract())
    );

    const onRequestCopyLaunchUrl = useConstCallback(
        () => copyToClipboard(window.location.href)
    );

    const onFriendlyNameChange = useConstCallback(
        (friendlyName: string) =>
            dispatch(thunks.onFriendlyNameChange(friendlyName))
    );

    if (launcherState === null) {
        return null;
    }

    return (
        <div className={cx(classNames.root, className)}>
            <CatalogLauncherMainCard
                packageName={launcherState.packageName}
                packageIconUrl={launcherState.icon}
                isBookmarked={false}
                onIsBookmarkedValueChange={() => { }}

                friendlyName={dispatch(thunks.getFriendlyName())}
                onFriendlyNameChange={onFriendlyNameChange}

                onRequestLaunch={onRequestLaunch}
                onRequestCancel={onRequestCancel}

                isLocked={false}

                onRequestCopyLaunchUrl={
                    launcherState.formFieldsValueDifferentFromDefault.length !== 0 ?
                        onRequestCopyLaunchUrl :
                        undefined
                }
            />
            <CatalogLauncherConfigurationCard
                formFieldsByTab={formFieldsByTab}
                onFormValueChange={onFormValueChange}
                contract={launcherState.contract}
                previewContract={previewContract}
            />

        </div>
    );

});
