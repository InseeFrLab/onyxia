import "minimal-polyfills/Object.fromEntries";
import { memo } from "react";
import { LeftBar as OnyxiaUiLeftBar, type LeftBarProps } from "onyxia-ui/LeftBar";
import { useTranslation } from "ui/i18n";
import { useLogoContainerWidth } from "ui/shared/BrandHeaderSection";
import { useRoute, routes, urlToLink } from "ui/routes";
import { env } from "env";
import { declareComponentKeys } from "i18nifty";
import { useCore, useCoreState } from "core";
import { assert, type Equals } from "tsafe/assert";
import { symToStr } from "tsafe/symToStr";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { customIcons, getIconUrl, getIconUrlByName } from "lazy-icons";
import { tss } from "tss";

type Props = {
    className?: string;
};

export const LeftBar = memo((props: Props) => {
    const { className } = props;

    const { secretExplorer } = useCore().functions;

    const { isDevModeEnabled } = useCoreState("userConfigs", "userConfigs");
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");

    const route = useRoute();

    const { logoContainerWidth } = useLogoContainerWidth();

    const { t } = useTranslation({ LeftBar });

    const { classes, cx } = useStyles();

    return (
        <>
            <OnyxiaUiLeftBar
                className={cx(classes.root, className)}
                doPersistIsPanelOpen={true}
                defaultIsPanelOpen={true}
                collapsedWidth={logoContainerWidth}
                reduceText={t("reduce")}
                items={[
                    {
                        itemId: "home",
                        icon: customIcons.homeSvgUrl,
                        label: t("home"),
                        link: routes.home().link,
                        availability: env.DISABLE_HOMEPAGE ? "not visible" : "available"
                    },
                    {
                        itemId: "account",
                        icon: customIcons.accountSvgUrl,
                        label: t("account"),
                        link: routes.account().link
                    },
                    {
                        itemId: "projectSettings",
                        icon: getIconUrlByName("DisplaySettings"),
                        label: t("projectSettings"),
                        link: routes.projectSettings().link
                    },
                    {
                        groupId: "services",
                        label: t("divider: services features")
                    },
                    {
                        itemId: "catalog",
                        icon: customIcons.catalogSvgUrl,
                        label: t("catalog"),
                        link: routes.catalog().link
                    },
                    {
                        itemId: "myServices",
                        icon: customIcons.servicesSvgUrl,
                        label: t("myServices"),
                        link: routes.myServices().link
                    },
                    {
                        groupId: "external-services",
                        label: t("divider: external services features")
                    },
                    {
                        itemId: "mySecrets",
                        icon: customIcons.secretsSvgUrl,
                        label: t("mySecrets"),
                        link: routes.mySecrets().link,
                        availability: secretExplorer.getIsEnabled()
                            ? "available"
                            : "not visible"
                    },
                    {
                        itemId: "myFiles",
                        icon: customIcons.filesSvgUrl,
                        label: t("myFiles"),
                        link: routes.myFiles().link,
                        availability: isFileExplorerEnabled ? "available" : "not visible"
                    },
                    {
                        itemId: "dataExplorer",
                        icon: getIconUrlByName("DocumentScanner"),
                        label: t("dataExplorer"),
                        link: routes.dataExplorer().link,
                        availability: isFileExplorerEnabled ? "available" : "not visible"
                    },
                    {
                        itemId: "sqlOlapShell",
                        icon: getIconUrlByName("Terminal"),
                        label: t("sqlOlapShell"),
                        link: routes.sqlOlapShell().link,
                        availability: isDevModeEnabled ? "available" : "not visible"
                    },
                    {
                        groupId: "custom-leftbar-links",
                        label: t("divider: onyxia instance specific features")
                    },
                    ...env.LEFTBAR_LINKS.map(({ url, ...rest }) => ({
                        link: urlToLink(url),
                        ...rest
                    }))
                        .map(({ icon, startIcon, ...rest }) => ({
                            ...rest,
                            icon: getIconUrl(icon) ?? getIconUrl(startIcon)
                        }))
                        .map(
                            ({ link, icon, label }, i): LeftBarProps.Item => ({
                                itemId: `custom-leftbar-item-${i}`,
                                icon:
                                    (assert(
                                        icon !== undefined,
                                        "We should have validated that when parsing the env"
                                    ),
                                    icon),
                                label: (
                                    <LocalizedMarkdown inline>{label}</LocalizedMarkdown>
                                ),
                                link
                            })
                        )
                ]}
                currentItemId={(() => {
                    switch (route.name) {
                        case "home":
                            return "home" as const;
                        case "account":
                            return "account";
                        case "projectSettings":
                            return "projectSettings";
                        case "catalog":
                            return "catalog";
                        case "launcher":
                            return "catalog";
                        case "myServices":
                        case "myService":
                            return "myServices";
                        case "mySecrets":
                            return "mySecrets";
                        case "myFiles":
                            return "myFiles";
                        case "sqlOlapShell":
                            return "sqlOlapShell";
                        case "dataExplorer":
                            return "dataExplorer";
                        case "page404":
                            return null;
                        case "document":
                            return null;
                        case false:
                            return null;
                    }
                    assert<Equals<typeof route, never>>(false);
                })()}
            />
        </>
    );
});

const useStyles = tss.withName({ LeftBar }).create({ root: {} });

LeftBar.displayName = symToStr({ LeftBar });

const { i18n } = declareComponentKeys<
    | "reduce"
    | "home"
    | "account"
    | "projectSettings"
    | "catalog"
    | "myServices"
    | "mySecrets"
    | "myFiles"
    | "dataExplorer"
    | "sqlOlapShell"
    | "divider: services features"
    | "divider: external services features"
    | "divider: onyxia instance specific features"
>()({ LeftBar });
export type I18n = typeof i18n;
