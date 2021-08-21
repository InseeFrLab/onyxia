import { useRef, useState, memo } from "react";
import type { ChangeEventHandler } from "react";
import { makeStyles } from "app/theme";

import { Icon } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useClickAway } from "app/tools/useClickAway";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
    className?: string;
    search: string;
    onSearchChange(search: string): void;
    evtAction: NonPostableEvt<"CLEAR SEARCH">;
};

const useStyles = makeStyles<{ isActive: boolean }>()((theme, { isActive }) => ({
    "root": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1],
        "& > div": {
            "display": "flex",
            "alignItems": "center",
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "cursor": isActive ? undefined : "pointer",
            "overflow": "hidden",
            "border": "solid 2px transparent",
            "&:hover": {
                "borderBottomColor": theme.colors.useCases.buttons.actionActive,
            },
        },
    },
    "input": {
        "flex": 1,
        "caretColor": theme.colors.useCases.typography.textFocus,
        ...theme.typography.variants["body 1"].style,
        "outline": "none",
        "borderWidth": 0,
        "border": "none",
        "backgroundColor": "transparent",
        "color": theme.colors.useCases.typography.textPrimary,
        "&::placeholder": {
            "color": theme.colors.useCases.typography.textDisabled,
            "opacity": 1,
        },
    },
    "icon": {
        "margin": `${theme.spacing(2) - 2}px ${theme.spacing(3) - 2}px`,
        "color": isActive ? theme.colors.useCases.typography.textFocus : undefined,
    },
    "searchLabel": {
        ...(theme.muiTheme.typography.button as any),
        "display": "block",
        "flex": 1,
        "color": theme.colors.useCases.typography.textPrimary,
    },
}));

export const CatalogExplorerSearchBar = memo((props: Props) => {
    const { className, onSearchChange, search, evtAction } = props;

    const [isActive, setIsActive] = useState(search !== "");

    const { classes, cx } = useStyles({ isActive });

    const { t } = useTranslation("CatalogExplorerSearchBar");

    const onClearButtonClick = useConstCallback(() => {
        onSearchChange("");
        inputRef.current?.focus();
    });
    const onRootClick = useConstCallback(() => setIsActive(true));
    const onIconClick = useConstCallback(() => {
        const { current: inputEl } = inputRef;
        if (inputEl === null) return;
        inputEl.focus();
        inputEl.setSelectionRange(0, search.length);
    });
    const onInputChange = useConstCallback<ChangeEventHandler<HTMLInputElement>>(
        event => {
            const { value } = event.target;
            onSearchChange(value);
        },
    );

    const inputRef = useRef<HTMLInputElement>(null);

    const onInputKeyDown = useConstCallback((event: { key: string }) => {
        const key = (() => {
            switch (event.key) {
                case "Escape":
                case "Enter":
                    return event.key;
                default:
                    return "irrelevant";
            }
        })();

        if (key === "irrelevant") {
            return;
        }

        switch (key) {
            case "Enter":
                if (search === "") {
                    setIsActive(false);
                }
                break;
            case "Escape":
                onSearchChange("");
                setIsActive(false);
                break;
        }

        inputRef.current?.blur();
    });

    const { rootRef } = useClickAway(() => {
        if (search !== "") return;
        setIsActive(false);
    });

    useEvt(
        ctx =>
            evtAction.attach(
                action => action === "CLEAR SEARCH",
                ctx,
                () => onInputKeyDown({ "key": "Escape" }),
            ),

        [evtAction],
    );

    return (
        <div ref={rootRef} className={cx(classes.root, className)} onClick={onRootClick}>
            <div>
                <Icon iconId="search" onClick={onIconClick} className={classes.icon} />
                {isActive ? (
                    <>
                        <input
                            ref={inputRef}
                            autoFocus={true}
                            className={classes.input}
                            type="text"
                            value={search}
                            onChange={onInputChange}
                            onKeyDown={onInputKeyDown}
                            spellCheck={false}
                            placeholder={t("search")}
                        />
                        {
                            <IconButton
                                iconId="cancel"
                                size="small"
                                disabled={search === ""}
                                onClick={onClearButtonClick}
                            />
                        }
                    </>
                ) : (
                    <span className={classes.searchLabel}>{t("search")}</span>
                )}
            </div>
        </div>
    );
});

export declare namespace CatalogExplorerSearchBar {
    export type I18nScheme = {
        search: undefined;
    };
}
