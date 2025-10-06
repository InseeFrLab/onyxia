import { useState, useMemo } from "react";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";
import { SearchBar } from "onyxia-ui/SearchBar";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    url: string;
    onUrlChange: (value: string) => void;
};

export function UrlInput(props: Props) {
    const { className, url, onUrlChange } = props;

    const { t } = useTranslation({ UrlInput });
    const [urlBeingTyped, setUrlBeingTyped] = useState(url);

    const hasActionButton = useMemo(() => {
        if (urlBeingTyped === url) {
            return false;
        }

        if (urlBeingTyped === "") {
            return true;
        }

        try {
            new URL(urlBeingTyped);
        } catch {
            return false;
        }

        return true;
    }, [url, urlBeingTyped]);

    const { classes, cx } = useStyles({ hasActionButton });

    useEffectOnValueChange(() => {
        setUrlBeingTyped(url);
    }, [url]);

    const onButtonClick = () => onUrlChange(urlBeingTyped);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.searchBarWrapper}>
                <SearchBar
                    search={urlBeingTyped}
                    onSearchChange={setUrlBeingTyped}
                    placeholder="Data source"
                    restorableSearch={url}
                    onKeyPress={
                        !hasActionButton
                            ? undefined
                            : key => {
                                  if (key !== "Enter") {
                                      return;
                                  }

                                  onButtonClick();
                              }
                    }
                />
            </div>
            <Button
                className={classes.loadButton}
                startIcon={
                    urlBeingTyped === ""
                        ? getIconUrlByName("Clear")
                        : getIconUrlByName("CloudDownload")
                }
                onClick={onButtonClick}
            >
                {urlBeingTyped === "" ? t("reset") : t("load")}
            </Button>
        </div>
    );
}

const useStyles = tss
    .withName({ UrlInput })
    .withParams<{ hasActionButton: boolean }>()
    .create(({ theme, hasActionButton }) => ({
        root: {
            display: "flex"
        },
        searchBarWrapper: {
            flex: 1
        },
        loadButton: {
            visibility: hasActionButton ? "visible" : "hidden",
            marginLeft: theme.spacing(4)
        }
    }));

const { i18n } = declareComponentKeys<"load" | "reset">()({ UrlInput });
export type I18n = typeof i18n;
