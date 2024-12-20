import { useState } from "react";
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

    const isLoadable = urlBeingTyped !== url;

    const { classes, cx } = useStyles({ isLoadable });

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
                    onKeyPress={key => {
                        if (key !== "Enter") {
                            return;
                        }

                        if (!isLoadable) {
                            return;
                        }

                        onButtonClick();
                    }}
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
    .withParams<{ isLoadable: boolean }>()
    .create(({ theme, isLoadable }) => ({
        root: {
            display: "flex"
        },
        searchBarWrapper: {
            flex: 1
        },
        loadButton: {
            visibility: isLoadable ? "visible" : "hidden",
            marginLeft: theme.spacing(4)
        }
    }));

const { i18n } = declareComponentKeys<"load" | "reset">()({ UrlInput });
export type I18n = typeof i18n;
