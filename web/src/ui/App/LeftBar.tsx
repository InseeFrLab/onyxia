import "minimal-polyfills/Object.fromEntries";
import { memo } from "react";
import { LeftBar as OnyxiaUiLeftBar, type LeftBarProps } from "onyxia-ui/LeftBar";
import { useTranslation } from "ui/i18n";
import { useLogoContainerWidth } from "ui/shared/BrandHeaderSection";
import { useRoute, routes, urlToLink } from "ui/routes";
import { id } from "tsafe/id";
import { env } from "env-parsed";
import { declareComponentKeys } from "i18nifty";
import { useCore, useCoreState } from "core";
import { assert, type Equals } from "tsafe/assert";
import { customIcons } from "ui/theme";
import { symToStr } from "tsafe/symToStr";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

type Props = {
    className?: string;
};

export const LeftBar = memo((props: Props) => {
    const { className } = props;

    const { fileExplorer, secretExplorer } = useCore().functions;

    const { isDevModeEnabled } = useCoreState("userConfigs", "main");

    const route = useRoute();

    const { logoContainerWidth } = useLogoContainerWidth();

    const { t } = useTranslation({ LeftBar });

    return (
        <OnyxiaUiLeftBar
            className={className}
            doPersistIsPanelOpen={true}
            defaultIsPanelOpen={true}
            collapsedWidth={logoContainerWidth}
            reduceText={t("reduce")}
            items={{
                ...(env.DISABLE_HOMEPAGE
                    ? ({} as never)
                    : {
                          "home": {
                              "icon": customIcons.homeSvgUrl,
                              "label": t("home"),
                              "link": routes.home().link
                          } as const
                      }),
                "account": {
                    "icon": customIcons.accountSvgUrl,
                    "label": t("account"),
                    "link": routes.account().link,
                    "belowDivider": t("divider: services features")
                },
                "catalog": {
                    "icon": customIcons.catalogSvgUrl,
                    "label": t("catalog"),
                    "link": routes.catalog().link
                },
                "myServices": {
                    "icon": customIcons.servicesSvgUrl,
                    "label": t("myServices"),
                    "link": routes.myServices().link,
                    "belowDivider": t("divider: external services features")
                },
                ...(!secretExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "mySecrets": {
                              "icon": customIcons.secretsSvgUrl,
                              "label": t("mySecrets"),
                              "link": routes.mySecrets().link
                          } as const
                      }),
                ...(!fileExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "myFiles": {
                              "icon": customIcons.filesSvgUrl,
                              "label": t("myFiles"),
                              "link": routes.myFiles().link
                          } as const
                      }),
                ...(!isDevModeEnabled
                    ? ({} as never)
                    : {
                          "sqlOlapShell": {
                              "icon": "Terminal",
                              "label": t("sqlOlapShell"),
                              "link": routes.sqlOlapShell().link
                          } as const
                      }),
                "dataExplorer": {
                    "icon": id<MuiIconComponentName>("DocumentScanner"),
                    "label": t("dataExplorer"),
                    "link": routes.dataExplorer().link,
                    "belowDivider":
                        env.LEFTBAR_LINKS.length === 0
                            ? true
                            : t("divider: onyxia instance specific features")
                } as const,
                ...Object.fromEntries(
                    env.LEFTBAR_LINKS.map(({ url, ...rest }) => ({
                        "link": urlToLink(url),
                        ...rest
                    }))
                        .map(({ icon, startIcon, ...rest }) => ({
                            ...rest,
                            "icon": icon ?? startIcon
                        }))
                        .map(({ link, icon, label }, i) => [
                            `extraItem${i}`,
                            id<LeftBarProps.Item>({
                                "icon":
                                    (assert(
                                        icon !== undefined,
                                        "We should have validated that when parsing the env"
                                    ),
                                    icon),
                                "label": (
                                    <LocalizedMarkdown inline>{label}</LocalizedMarkdown>
                                ),
                                link
                            })
                        ])
                )
            }}
            currentItemId={(() => {
                switch (route.name) {
                    case "home":
                        return "home" as const;
                    case "account":
                        return "account";
                    case "catalog":
                        return "catalog";
                    case "launcher":
                        return "catalog";
                    case "myServices":
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
                    case "terms":
                        return null;
                    case false:
                        return null;
                }
                assert<Equals<typeof route, never>>(false);
            })()}
        />
    );
});

LeftBar.displayName = symToStr({ LeftBar });

export const { i18n } = declareComponentKeys<
    | "reduce"
    | "home"
    | "account"
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
