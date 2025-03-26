import { memo } from "react";
import { tss } from "tss";
import { RoundLogo } from "ui/shared/RoundLogo";
import {
    MyServicesRestorableConfigOptions,
    type RestorableConfigAction
} from "./MyServicesRestorableConfigOptions";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useTranslation } from "ui/i18n";
import { IconButton } from "onyxia-ui/IconButton";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import type { Link } from "type-route";
import { assert, type Equals } from "tsafe/assert";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
    isShortVariant: boolean;
    chartIconUrl: string | undefined;
    friendlyName: string;
    launchLink: Link;
    editLink: Link;
    isFirst: boolean;
    isLast: boolean;
    onRequestDelete: () => void;
    onRequestToMove: (params: { direction: "up" | "down" }) => void;
};

export const MyServicesRestorableConfig = memo((props: Props) => {
    const {
        isShortVariant,
        friendlyName,
        chartIconUrl,
        className,
        launchLink,
        editLink,
        isFirst,
        isLast,
        onRequestDelete,
        onRequestToMove
    } = props;

    const { classes, cx } = useStyles({
        hasIcon: chartIconUrl !== undefined,
        isShortVariant
    });

    const { t } = useTranslation({ MyServicesRestorableConfig });

    const editButtonRef = useStateRef<HTMLButtonElement>(null);

    const configOptionsCallback = useConstCallback((action: RestorableConfigAction) => {
        switch (action) {
            case "copy link":
                navigator.clipboard.writeText(
                    `${window.location.origin}${launchLink.href}`
                );
                return;
            case "delete":
                onRequestDelete();
                return;
            case "edit":
                assert(editButtonRef.current !== null);
                editButtonRef.current.click();
                return;
            case "move down":
                onRequestToMove({ direction: "down" });
                return;
            case "move up":
                onRequestToMove({ direction: "up" });
                return;
        }
        assert<Equals<typeof action, never>>(false);
    });

    return (
        <div className={cx(classes.root, className)}>
            {!isShortVariant && (
                <IconButton icon={getIconUrlByName("Delete")} onClick={onRequestDelete} />
            )}
            <RoundLogo url={chartIconUrl} className={classes.logo} size="medium" />
            <div className={classes.friendlyNameWrapper}>
                <Text typo="label 1" className={classes.friendlyName}>
                    {friendlyName}
                </Text>
            </div>
            <div className={classes.linkAndEditButtonWrapper}>
                <IconButton
                    className={classes.linkIcon}
                    icon={getIconUrlByName("Link")}
                    onClick={() => configOptionsCallback("copy link")}
                />
                <Button
                    className={classes.editIcon}
                    ref={editButtonRef}
                    {...editLink}
                    doOpenNewTabIfHref={false}
                    variant="secondary"
                >
                    {t("edit")}
                </Button>
            </div>
            <Button {...launchLink} doOpenNewTabIfHref={false} variant="secondary">
                {t("launch")}
            </Button>
            <IconButton
                //className={classes.linkIcon}
                icon={getIconUrlByName("DragIndicator")}
                onClick={() => console.log("drag button")}
            />
            {isShortVariant && (
                <MyServicesRestorableConfigOptions
                    doDisableMoveUp={isFirst}
                    doDisableMoveDown={isLast}
                    callback={configOptionsCallback}
                />
            )}
        </div>
    );
});

MyServicesRestorableConfig.displayName = symToStr({ MyServicesRestorableConfig });

const { i18n } = declareComponentKeys<"edit" | "launch">()({
    MyServicesRestorableConfig
});
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{ hasIcon: boolean; isShortVariant: boolean }>()
    .withName({ MyServicesRestorableConfig })
    .create(({ theme, isShortVariant, hasIcon }) => ({
        root: {
            borderRadius: 16,
            boxShadow: theme.shadows[1],
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                boxShadow: theme.shadows[6]
            },
            display: "flex",
            alignItems: "center",
            padding: theme.spacing(2),
            paddingRight: theme.spacing(3)
        },
        logo: {
            visibility: hasIcon ? undefined : "hidden",
            ...theme.spacing.rightLeft("margin", 2)
        },
        friendlyNameWrapper: {
            overflow: "hidden",
            whiteSpace: "nowrap",
            flex: 1
        },
        friendlyName: {
            overflow: "hidden",
            textOverflow: "ellipsis"
        },
        linkIcon: {
            marginRight: theme.spacing(3)
        },
        editIcon: {
            marginRight: theme.spacing(3)
        },
        linkAndEditButtonWrapper: !isShortVariant
            ? {}
            : {
                  width: 0,
                  height: 0,
                  overflow: "hidden"
              }
    }));
