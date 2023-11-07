import "minimal-polyfills/Object.fromEntries";
import { memo } from "react";
import { LeftBar as OnyxiaUiLeftBar, type LeftBarProps } from "onyxia-ui/LeftBar";
import { useTranslation, useResolveLocalizedString } from "ui/i18n";
import { useLogoContainerWidth } from "ui/shared/BrandHeaderSection";
import { useRoute, routes, session } from "ui/routes";
import { id } from "tsafe/id";
import { env } from "env-parsed";
import { declareComponentKeys } from "i18nifty";
import { useCoreFunctions } from "core";
import { assert, type Equals } from "tsafe/assert";
import { customIcons } from "ui/theme";
import { symToStr } from "tsafe/symToStr";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

type Props = {
    className?: string;
};

export const LeftBar = memo((props: Props) => {
    const { className } = props;

    const { fileExplorer, secretExplorer } = useCoreFunctions();

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

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
                ...(env.DISABLE_HOME_PAGE
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
                              "link": routes.myFiles().link,
                              "belowDivider":
                                  env.EXTRA_LEFTBAR_ITEMS.length === 0
                                      ? true
                                      : t("divider: onyxia instance specific features")
                          } as const
                      }),
                ...Object.fromEntries(
                    env.EXTRA_LEFTBAR_ITEMS.map(({ icon, label, url }, i) => [
                        `extraItem${i}`,
                        id<LeftBarProps.Item>({
                            "icon": icon ?? id<MuiIconComponentName>("OpenInNew"),
                            "label": resolveLocalizedString(label),
                            "link": {
                                "href": url,
                                "target": !url.startsWith("/") ? "_blank" : undefined,
                                "onClick": !url.startsWith("/")
                                    ? undefined
                                    : e => {
                                          e.preventDefault();
                                          session.push(url);
                                      }
                            }
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
    | "divider: services features"
    | "divider: external services features"
    | "divider: onyxia instance specific features"
>()({ LeftBar });
