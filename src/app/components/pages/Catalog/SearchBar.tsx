import { useRef, useState, memo } from "react";
import type { ChangeEventHandler } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { Icon } from "app/components/designSystem/Icon";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/components/designSystem/IconButton";
import { useConstCallback } from "powerhooks";
import { useClickAway } from "app/tools/useClickAway";
import { typography } from "app/theme/typography";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";


export type Props = {
    className?: string;
    onSearchChange(search: string): void;
    evtAction: NonPostableEvt<{ action: "SET SEARCH"; search: string; }>;
};

const { useClassNames } = createUseClassNames<{ isActive: boolean; }>()(
    (theme, { isActive }) => ({
        "root": {
            "borderRadius": 8,
            "overflow": "hidden",
            "boxShadow": theme.custom.shadows[1],
            "& > div": {
                "display": "flex",
                "alignItems": "center",
                "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
                "cursor": isActive ? undefined : "pointer",
                "overflow": "hidden",
                "border": "solid 2px transparent",
                "&:hover": {
                    "borderBottomColor": theme.custom.colors.useCases.buttons.actionActive,
                }
            }
        },
        "input": {
            "flex": 1,
            "caretColor": theme.custom.colors.useCases.typography.textFocus,
            "fontFamily": typography.fontFamily,
            ...typography.body1,
            "outline": "none",
            "borderWidth":0,
            "border":"none"
        },
        "icon": {
            "margin": `${theme.spacing(1) - 2}px ${theme.spacing(2) - 2}px`,
        },
        "searchLabel": {
            "display": "block",
            "flex": 1,
            ...typography.button
        }
    })
);

export const SearchBar = memo((props: Props) => {

    const { className, onSearchChange, evtAction } = props;

    const [isActive, setIsActive] = useState(false);

    const { classNames } = useClassNames({ isActive });

    const { t } = useTranslation("SearchBar");

    const [search, setSearch] = useState("");
    const onClearButtonClick = useConstCallback(() => {
        setSearch("")
        inputRef.current?.focus();
    });
    const onRootClick = useConstCallback(() => setIsActive(true));
    const onIconClick = useConstCallback(() => {
        const { current: inputEl } = inputRef;
        if (inputEl === null) return;
        inputEl.focus();
        inputEl.setSelectionRange(0, search.length)
    });
    const onInputChange = useConstCallback<ChangeEventHandler<HTMLInputElement>>(
        event => {
            const { value } = event.target;
            setSearch(value);
            onSearchChange(value);
        }
    );


    const inputRef = useRef<HTMLInputElement>(null);

    const onInputKeyDown = useConstCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>) => {

            const key = (() => {
                switch (event.key) {
                    case "Escape":
                    case "Enter":
                        return event.key;
                    default: return "irrelevant";
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
                    setSearch("");
                    setIsActive(false);
                    break;
            }

            inputRef.current?.blur();

        }
    );

    const { rootRef } = useClickAway(() => {
        if (search !== "") return;
        setIsActive(false)
    });

    useEvt(
        ctx => evtAction.attach(
            ctx,
            ({ search }) => setSearch(search)
        ),
        [evtAction]
    );

    return (
        <div
            ref={rootRef}
            className={cx(classNames.root, className)}
            onClick={onRootClick}
        >
            <div>
                <Icon
                    color={isActive ? "textFocus" : undefined}
                    type="search"
                    onClick={onIconClick}
                    className={classNames.icon}
                />
                {
                    isActive ?
                        <>
                            <input
                                ref={inputRef}
                                autoFocus={true}
                                className={classNames.input}
                                type="text"
                                value={search}
                                onChange={onInputChange}
                                onKeyDown={onInputKeyDown}
                                spellCheck={false}
                                placeholder={t("search")}
                            />
                            {
                                <IconButton
                                    fontSize="small"
                                    type="cancel"
                                    disabled={search === ""}
                                    onClick={onClearButtonClick}
                                />
                            }
                        </>
                        :
                        <span className={classNames.searchLabel} >
                            {t("search")}
                        </span>
                }
            </div>
        </div>

    );

});

export declare namespace SearchBar {

    export type I18nScheme = {
        search: undefined;
    };
}