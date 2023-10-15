import { useLang, useTranslation } from "ui/i18n";
import { PageHeader, tss } from "ui/theme";
import { CatalogLauncher } from "./CatalogLauncher";
import MuiLink from "@mui/material/Link";
import { useCoreState, selectors } from "core";
import { elementsToSentence } from "ui/tools/elementsToSentence";
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

    const { isLauncherReady, packageName, sources } = useCoreState(
        selectors.launcher.headerWrap
    ).headerWrap;

    const { lang } = useLang();

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    "title": css({ "paddingBottom": 3 })
                }}
                mainIcon="catalog"
                title={t("header text1")}
                helpTitle={t("header text2")}
                helpContent={(() => {
                    if (!isLauncherReady) {
                        return <></>;
                    }

                    if (sources.length === 0) {
                        return <></>;
                    }

                    return (
                        <>
                            {t("contribute to the package", {
                                packageName
                            })}
                            {elementsToSentence({
                                "elements": sources.map(source => (
                                    <MuiLink
                                        href={source}
                                        target="_blank"
                                        underline="hover"
                                    >
                                        {t("here")}
                                    </MuiLink>
                                )),
                                "language": lang
                            })}
                        </>
                    );
                })()}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={{
                    "behavior": "collapses on scroll",
                    "scrollTopThreshold": 100,
                    "scrollableElementRef": scrollableDivRef
                }}
                helpCollapseParams={{
                    "behavior": "collapses on scroll",
                    "scrollTopThreshold": 50,
                    "scrollableElementRef": scrollableDivRef
                }}
            />
            <div className={classes.bodyWrapper}>
                <CatalogLauncher route={route} scrollableDivRef={scrollableDivRef} />
            </div>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "header text1"
    | "header text2"
    | { K: "contribute to the catalog"; P: { catalogName: JSX.Element }; R: JSX.Element }
    | { K: "contribute to the package"; P: { packageName: string } }
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
