import { useTranslation, type LocalizedString } from "ui/i18n";
import { PageHeader, tss } from "ui/theme";
import { CatalogExplorer } from "./CatalogExplorer";
import { useCoreState, selectors } from "core";
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

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const { isReady, selectedCatalog, availableCatalogs, filteredCharts } = useCoreState(
        selectors.catalogExplorer.wrap
    ).wrap;

    if (!isReady) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    "title": css({ "paddingBottom": 3 })
                }}
                mainIcon="catalog"
                title={t("header text1")}
                helpTitle={t("header text2")}
                helpContent={t("header help", {
                    "catalogDescription": selectedCatalog.description,
                    "catalogName": selectedCatalog.name
                })}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={{
                    "behavior": "collapses on scroll",
                    "scrollTopThreshold": 600,
                    "scrollableElementRef": scrollableDivRef
                }}
                helpCollapseParams={{
                    "behavior": "collapses on scroll",
                    "scrollTopThreshold": 300,
                    "scrollableElementRef": scrollableDivRef
                }}
            />
            <div className={classes.bodyWrapper}>
                <CatalogExplorer route={route} scrollableDivRef={scrollableDivRef} />
            </div>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "header text1"
    | "header text2"
    | {
          K: "header help";
          P: {
              catalogName: LocalizedString;
              catalogDescription: LocalizedString;
          };
          R: JSX.Element;
      }
    | "here"
>()({ Catalog });

const useStyles = tss.withName({ Catalog }).create({
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
