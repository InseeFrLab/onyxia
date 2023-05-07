import { useMemo, memo } from "react";
import { useResolveLocalizedString, useLang, useTranslation } from "ui/i18n";
import { makeStyles, PageHeader } from "ui/theme";
import { CatalogExplorer } from "./CatalogExplorer";
import { CatalogLauncher } from "./CatalogLauncher";
import Link from "@mui/material/Link";
import { useCoreState, selectors } from "core";
import { elementsToSentence } from "ui/tools/elementsToSentence";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper_legacy";
import { assert } from "tsafe/assert";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function Catalog(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Catalog });

    const { classes, cx, css } = useStyles();

    const { scrollableDivRef } = (function useClosure() {
        const explorerScrollableDivRef = useStateRef<HTMLDivElement>(null);
        const launcherScrollableDivRef = useStateRef<HTMLDivElement>(null);

        const scrollableDivRef = (() => {
            switch (route.name) {
                case "catalogExplorer":
                    return explorerScrollableDivRef;
                case "catalogLauncher":
                    return launcherScrollableDivRef;
            }
        })();

        return { scrollableDivRef };
    })();

    const titleCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": (() => {
                switch (route.name) {
                    case "catalogExplorer":
                        return 600;
                    case "catalogLauncher":
                        return 100;
                }
            })(),
            "scrollableElementRef": scrollableDivRef
        }),
        [scrollableDivRef, route.name]
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": (() => {
                switch (route.name) {
                    case "catalogExplorer":
                        return 300;
                    case "catalogLauncher":
                        return 50;
                }
            })(),
            "scrollableElementRef": scrollableDivRef
        }),
        [scrollableDivRef, route.name]
    );

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    "title": css({ "paddingBottom": 3 })
                }}
                mainIcon="catalog"
                title={t("header text1")}
                helpTitle={t("header text2")}
                helpContent={<PageHeaderHelpContent routeName={route.name} />}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <div className={classes.bodyWrapper}>
                {(() => {
                    switch (route.name) {
                        case "catalogExplorer":
                            return (
                                <CatalogExplorer
                                    route={route}
                                    scrollableDivRef={scrollableDivRef}
                                />
                            );
                        case "catalogLauncher":
                            return (
                                <CatalogLauncher
                                    route={route}
                                    scrollableDivRef={scrollableDivRef}
                                />
                            );
                    }
                })()}
            </div>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "header text1"
    | "header text2"
    | { K: "contribute to the catalog"; P: { catalogName: JSX.Element } }
    | { K: "contribute to the package"; P: { packageName: string } }
    | "here"
>()({ Catalog });

const useStyles = makeStyles({ "name": { Catalog } })({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "bodyWrapper": {
        "flex": 1,
        "overflow": "hidden"
    }
});

const PageHeaderHelpContent = memo((params: { routeName: PageRoute["name"] }) => {
    const { routeName } = params;

    const { selectedCatalog } = useCoreState(selectors.catalogExplorer.selectedCatalog);
    const { sources } = useCoreState(selectors.launcher.sources);
    const { packageName } = useCoreState(selectors.launcher.packageName);

    const { t } = useTranslation({ Catalog });

    const { lang } = useLang();

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    switch (routeName) {
        case "catalogExplorer":
            if (selectedCatalog === undefined) {
                return null;
            }

            return (
                <>
                    {resolveLocalizedString(selectedCatalog.description)}
                    &nbsp;
                    <Link
                        href={selectedCatalog.location}
                        target="_blank"
                        underline="hover"
                    >
                        {t("contribute to the catalog", {
                            "catalogName": resolveLocalizedString(selectedCatalog.name)
                        })}
                    </Link>
                </>
            );
        case "catalogLauncher":
            if (packageName === undefined) {
                return null;
            }

            assert(sources !== undefined);

            if (sources.length === 0) {
                return null;
            }

            return (
                <>
                    {t("contribute to the package", {
                        "packageName": packageName
                    })}
                    {elementsToSentence({
                        "elements": sources.map(source => (
                            <Link href={source} target="_blank" underline="hover">
                                {t("here")}
                            </Link>
                        )),
                        "language": lang
                    })}
                </>
            );
    }
});
