import { useState } from "react";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { SearchBar } from "onyxia-ui/SearchBar";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { declareComponentKeys } from "ui/i18n";

type Props = {
    className?: string;
    url: string;
    onUrlChange: (value: string) => void;
    getIsValidUrl: (url: string) => boolean;
};

export function UrlInput(props: Props) {
    const { className, url, onUrlChange, getIsValidUrl } = props;

    const [urlBeingTyped, setUrlBeingTyped] = useState(url);

    const isLoadable = urlBeingTyped !== url && getIsValidUrl(urlBeingTyped);

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
                startIcon={id<MuiIconComponentName>("CloudDownload")}
                onClick={onButtonClick}
            >
                Load
            </Button>
        </div>
    );
}

const useStyles = tss
    .withName({ UrlInput })
    .withParams<{ isLoadable: boolean }>()
    .create(({ theme, isLoadable }) => ({
        "root": {
            "display": "flex"
        },
        "searchBarWrapper": {
            "flex": 1
        },
        "loadButton": {
            "visibility": isLoadable ? "visible" : "hidden",
            "marginLeft": theme.spacing(4)
        }
    }));

const { i18n } = declareComponentKeys<"load">()({ UrlInput });
export type I18n = typeof i18n;
