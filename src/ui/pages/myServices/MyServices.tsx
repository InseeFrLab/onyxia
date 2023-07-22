import { useEffect, useMemo, useState, useReducer } from "react";
import { makeStyles, PageHeader } from "ui/theme";

import { useTranslation } from "ui/i18n";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import type { Props as MyServicesCardsProps } from "./MyServicesCards";
import { MyServicesSavedConfigs } from "./MyServicesSavedConfigs";
import type { Props as MyServicesSavedConfigsProps } from "./MyServicesSavedConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreFunctions, useCoreState, selectors } from "core";
import { routes } from "ui/routes";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Button } from "ui/theme";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "tsafe/assert";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyServices(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyServices });

    /* prettier-ignore */
    const { runningService, restorablePackageConfig, projectConfigs } = useCoreFunctions();
    /* prettier-ignore */
    const { displayableConfigs } = useCoreState(selectors.restorablePackageConfig.displayableConfigs);
    /* prettier-ignore */
    const { isUpdating } = useCoreState(selectors.runningService.isUpdating);
    const { runningServices } = useCoreState(selectors.runningService.runningServices);
    /* prettier-ignore */
    const { deletableRunningServices } = useCoreState(selectors.runningService.deletableRunningServices);
    /* prettier-ignore */
    const { isThereOwnedSharedServices } = useCoreState(selectors.runningService.isThereOwnedSharedServices);
    /* prettier-ignore */
    const { isThereNonOwnedServices } = useCoreState(selectors.runningService.isThereNonOwnedServices);

    const [password, setPassword] = useState<string | undefined>(undefined);

    const [refreshPasswordTrigger, pullRefreshPasswordTrigger] = useReducer(
        count => count + 1,
        0
    );

    useEffect(() => {
        projectConfigs.getServicesPassword().then(upToDatePassword => {
            setPassword(upToDatePassword);

            if (password !== undefined && password !== upToDatePassword) {
                alert("Outdated password copied. Please click the button again");
            }
        });
    }, [password, refreshPasswordTrigger]);

    const onButtonBarClick = useConstCallback((buttonId: ButtonId) => {
        switch (buttonId) {
            case "launch":
                routes.catalogExplorer().push();
                return;
            case "refresh":
                runningService.update();
                return;
            case "password":
                assert(password !== undefined);

                navigator.clipboard.writeText(password);

                pullRefreshPasswordTrigger();

                return;
            case "trash":
                setIsDialogOpen(true);
                return;
        }
    });

    useEffect(() => {
        restorablePackageConfig.fetchIconsIfNotAlreadyDone();
    }, []);

    useEffect(() => {
        runningService.setIsUserWatching(true);
        return () => runningService.setIsUserWatching(false);
    }, []);

    const { isSavedConfigsExtended } = route.params;

    const { classes, cx } = useStyles({ isSavedConfigsExtended });

    const onRequestToggleIsShortVariant = useConstCallback(() =>
        routes
            .myServices({
                "isSavedConfigsExtended": !isSavedConfigsExtended ? true : undefined
            })
            .push()
    );

    const onSavedConfigsCallback = useConstCallback<
        MyServicesSavedConfigsProps["callback"]
    >(({ launchLinkHref, action }) => {
        switch (action) {
            case "copy link":
                navigator.clipboard.writeText(
                    `${window.location.origin}${launchLinkHref}`
                );
                return;
            case "delete":
                restorablePackageConfig.deleteRestorablePackageConfig({
                    "restorablePackageConfig": displayableConfigs.find(
                        ({ restorablePackageConfig }) =>
                            routes.catalogLauncher({
                                ...restorablePackageConfig,
                                "autoLaunch": true
                            }).href === launchLinkHref
                    )!.restorablePackageConfig
                });
                return;
        }
    });

    const savedConfigs = useMemo(
        (): MyServicesSavedConfigsProps["savedConfigs"] =>
            displayableConfigs.map(
                ({ logoUrl, friendlyName, restorablePackageConfig }) => {
                    const buildLink = (autoLaunch: boolean) =>
                        routes.catalogLauncher({
                            ...restorablePackageConfig,
                            autoLaunch
                        }).link;

                    return {
                        logoUrl,
                        friendlyName,
                        "launchLink": buildLink(true),
                        "editLink": buildLink(false)
                    };
                }
            ),
        [displayableConfigs]
    );

    const cards = useMemo(
        (): MyServicesCardsProps["cards"] | undefined =>
            runningServices?.map(
                ({
                    id,
                    logoUrl,
                    friendlyName,
                    packageName,
                    urls,
                    startedAt,
                    monitoringUrl,
                    isStarting,
                    postInstallInstructions,
                    vaultTokenExpirationTime,
                    s3TokenExpirationTime,
                    env,
                    ...rest
                }) => ({
                    "serviceId": id,
                    "packageIconUrl": logoUrl,
                    friendlyName,
                    packageName,
                    "openUrl": urls[0],
                    monitoringUrl,
                    "startTime": isStarting ? undefined : startedAt,
                    postInstallInstructions,
                    env,
                    "isShared": rest.isShared,
                    "isOwned": rest.isOwned,
                    "ownerUsername": rest.isOwned ? undefined : rest.ownerUsername,
                    vaultTokenExpirationTime,
                    s3TokenExpirationTime
                })
            ),
        [runningServices]
    );

    const evtMyServiceCardsAction = useConst(() =>
        Evt.create<UnpackEvt<MyServicesCardsProps["evtAction"]>>()
    );

    useEffect(() => {
        const { autoLaunchServiceId } = route.params;

        if (autoLaunchServiceId === undefined) {
            return;
        }

        const runningService = (runningServices ?? []).find(
            ({ id }) => id === autoLaunchServiceId
        );

        if (runningService === undefined) {
            return;
        }

        routes
            .myServices({
                ...route.params,
                "isSavedConfigsExtended": route.params.isSavedConfigsExtended
                    ? true
                    : undefined,
                "autoLaunchServiceId": undefined
            })
            .replace();

        evtMyServiceCardsAction.post({
            "action": "TRIGGER SHOW POST INSTALL INSTRUCTIONS",
            "serviceId": runningService.id
        });
    }, [route.params.autoLaunchServiceId, runningServices]);

    const catalogExplorerLink = useMemo(() => routes.catalogExplorer().link, []);

    const [serviceIdRequestedToBeDeleted, setServiceIdRequestedToBeDeleted] = useState<
        string | undefined
    >();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onRequestDelete = useConstCallback<MyServicesCardsProps["onRequestDelete"]>(
        ({ serviceId }) => {
            setServiceIdRequestedToBeDeleted(serviceId);
            setIsDialogOpen(true);
        }
    );

    const onDialogCloseFactory = useCallbackFactory(([doDelete]: [boolean]) => {
        if (doDelete) {
            if (serviceIdRequestedToBeDeleted) {
                runningService.stopService({
                    "serviceId": serviceIdRequestedToBeDeleted
                });
            } else {
                deletableRunningServices.map(({ id }) =>
                    runningService.stopService({ "serviceId": id })
                );
            }
        }

        setIsDialogOpen(false);
    });

    const getServicePassword = useConstCallback(() =>
        projectConfigs.getServicesPassword()
    );

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="services"
                title={t("text1")}
                helpTitle={t("text2")}
                helpContent={t("text3")}
                helpIcon="sentimentSatisfied"
            />
            <MyServicesButtonBar
                onClick={onButtonBarClick}
                isThereNonOwnedServicesShown={isThereNonOwnedServices}
                isThereDeletableServices={deletableRunningServices.length !== 0}
            />
            <div className={classes.payload}>
                <>
                    {!isSavedConfigsExtended && (
                        <MyServicesCards
                            isUpdating={isUpdating}
                            className={classes.cards}
                            cards={cards}
                            onRequestDelete={onRequestDelete}
                            catalogExplorerLink={catalogExplorerLink}
                            evtAction={evtMyServiceCardsAction}
                            getServicePassword={getServicePassword}
                        />
                    )}
                    <MyServicesSavedConfigs
                        isShortVariant={!isSavedConfigsExtended}
                        savedConfigs={savedConfigs}
                        className={classes.savedConfigs}
                        callback={onSavedConfigsCallback}
                        onRequestToggleIsShortVariant={onRequestToggleIsShortVariant}
                    />
                </>
            </div>
            <Dialog
                title={t("confirm delete title")}
                subtitle={t("confirm delete subtitle")}
                body={`${
                    isThereOwnedSharedServices
                        ? t("confirm delete body shared services")
                        : ""
                } ${t("confirm delete body")}`}
                isOpen={isDialogOpen}
                onClose={onDialogCloseFactory(false)}
                buttons={
                    <>
                        <Button onClick={onDialogCloseFactory(false)} variant="secondary">
                            {t("cancel")}
                        </Button>
                        <Button onClick={onDialogCloseFactory(true)}>
                            {t("confirm")}
                        </Button>
                    </>
                }
            />
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "text1"
    | "text2"
    | "text3"
    | "running services"
    | "confirm delete title"
    | "confirm delete subtitle"
    | "confirm delete body"
    | "confirm delete body shared services"
    | "cancel"
    | "confirm"
>()({ MyServices });

const useStyles = makeStyles<{
    isSavedConfigsExtended: boolean;
}>({ "name": { MyServices } })((theme, { isSavedConfigsExtended }) => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "payload": {
        "overflow": "hidden",
        "flex": 1,
        "display": "flex",
        "& > *": {
            "height": "100%"
        }
    },
    ...(() => {
        const ratio = 0.65;

        return {
            "cards": {
                "flex": ratio,
                "marginRight": theme.spacing(5)
            },
            "savedConfigs": {
                "flex": isSavedConfigsExtended ? 1 : 1 - ratio,
                "paddingRight": "2%"
            }
        };
    })()
}));
