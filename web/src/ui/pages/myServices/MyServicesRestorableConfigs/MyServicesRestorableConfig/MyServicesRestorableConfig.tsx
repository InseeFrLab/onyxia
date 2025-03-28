import { memo, useState } from "react";
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
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import type { Link } from "type-route";
import { assert, type Equals } from "tsafe/assert";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import { getIconUrlByName } from "lazy-icons";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";

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
    onRequestToMove: (params: { direction: "up" | "down" | "top" | "bottom" }) => void;
    onRequestRename: (params: { newFriendlyName: string }) => void;
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
        onRequestToMove,
        onRequestRename
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
            case "move bottom":
                onRequestToMove({ direction: "bottom" });
                return;
            case "move top":
                onRequestToMove({ direction: "top" });
                return;
        }
        assert<Equals<typeof action, never>>(false);
    });

    const [isEditingFriendlyName, setIsEditingFriendlyName] = useState(false);
    const evtFriendlyNameTextFieldAction = useConst(() =>
        Evt.create<TextFieldProps["evtAction"]>()
    );

    return (
        <div className={cx(classes.root, className)}>
            {!isShortVariant && (
                <IconButton icon={getIconUrlByName("Delete")} onClick={onRequestDelete} />
            )}
            <div className={classes.friendlyNameWrapper}>
                <RoundLogo url={chartIconUrl} className={classes.logo} size="medium" />

                {isEditingFriendlyName ? (
                    <TextField
                        inputProps_autoFocus={true}
                        selectAllTextOnFocus={true}
                        defaultValue={friendlyName}
                        evtAction={evtFriendlyNameTextFieldAction}
                        onEnterKeyDown={() =>
                            evtFriendlyNameTextFieldAction.post("TRIGGER SUBMIT")
                        }
                        onSubmit={newFriendlyName => {
                            setIsEditingFriendlyName(false);

                            onRequestRename({ newFriendlyName });
                        }}
                        onEscapeKeyDown={() => {
                            setIsEditingFriendlyName(false);
                        }}
                    />
                ) : (
                    <Text typo="label 1" className={classes.friendlyName}>
                        {friendlyName}
                    </Text>
                )}
                {isEditingFriendlyName ? (
                    <IconButton
                        icon={getIconUrlByName("Check")}
                        onClick={() =>
                            evtFriendlyNameTextFieldAction.post("TRIGGER SUBMIT")
                        }
                    />
                ) : (
                    <IconButton
                        icon={getIconUrlByName("Edit")}
                        onClick={() => setIsEditingFriendlyName(true)}
                    />
                )}
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

            <MyServicesRestorableConfigOptions
                doDisableMoveUp={isFirst}
                doDisableMoveDown={isLast}
                callback={configOptionsCallback}
                isShortVariant={isShortVariant}
            />
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
            flex: 1,
            display: "flex",
            alignItems: "center"
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
