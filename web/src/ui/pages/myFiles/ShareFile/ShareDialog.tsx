import { declareComponentKeys } from "i18nifty";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { DirectoryOrFileDetailed } from "../shared/DirectoryOrFileDetailed";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { SelectTime } from "./SelectTime";
import { FileItem } from "../shared/types";
import TextField from "@mui/material/TextField";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";

type ShareDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem;
    url: string | undefined; //undefined if file.policy is public
    isRequestingUrl: boolean;
    validityDurationSecondOptions: number[];
    onRequestUrl: (params: { expirationTime: number }) => void;
};

export const ShareDialog = memo((props: ShareDialogProps) => {
    const {
        file,
        url,
        isOpen,
        onClose,
        isRequestingUrl,
        onRequestUrl,
        validityDurationSecondOptions
    } = props;
    const { t } = useTranslation({ ShareDialog });

    const { classes } = useStyles();

    const [valueExpirationTime, setValueExpirationTime] = useState<number>(
        validityDurationSecondOptions[0]
    );
    const isPublic = file.policy === "public";

    //const shareIconId = getIconUrlByName(isPublic ? "VisibilityOff" : "Visibility");

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            body={
                <div className={classes.body}>
                    <Text typo="label 1">
                        {t("paragraph current policy", { policy: file.policy })}
                    </Text>

                    <Text typo="body 1">
                        {t("paragraph change policy", { policy: file.policy })}
                    </Text>

                    {url === undefined ? (
                        <div className={classes.createLink}>
                            <SelectTime
                                expirationValue={valueExpirationTime}
                                validityDurationSecondOptions={
                                    validityDurationSecondOptions
                                }
                                onExpirationValueChange={setValueExpirationTime}
                            />
                            <Button
                                startIcon={getIconUrlByName("Language")}
                                variant="ternary"
                                onClick={() => onRequestUrl({ expirationTime: 30_000 })} //TODO
                            >
                                {t("create and copy link")}
                                &nbsp;
                                <CircularProgress />
                            </Button>
                        </div>
                    ) : (
                        <TextField
                            label={t("label input link")}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <CopyToClipboardIconButton textToCopy={url} />
                                    )
                                }
                            }}
                            helperText={t("hint link access", {
                                policy: file.policy,
                                expirationDate: undefined //TODO
                            })}
                            variant="standard"
                            value={url}
                        />
                    )}
                </div>
            }
            title={t("title")}
            subtitle={
                <DirectoryOrFileDetailed
                    name={file.basename}
                    kind={file.kind}
                    isPublic={isPublic}
                    className={classes.directoryDetails}
                />
            }
            buttons={
                <Button
                    autoFocus
                    doOpenNewTabIfHref={false}
                    onClick={onClose}
                    variant="primary"
                >
                    {t("close")}
                </Button>
            }
        />
    );
});

const useStyles = tss.withName({ ShareDialog }).create(({ theme }) => ({
    body: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(6),
        marginBottom: theme.spacing(6)
    },
    directoryDetails: {
        padding: theme.spacing(4)
    },
    createLink: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between"
    }
}));
const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | "create and copy link"
    | { K: "paragraph current policy"; P: { policy: FileItem["policy"] } }
    | { K: "paragraph change policy"; P: { policy: FileItem["policy"] } }
    | {
          K: "hint link access";
          P: { policy: FileItem["policy"]; expirationDate: Date | undefined };
      }
    | "label input link"
>()({
    ShareDialog
});
export type I18n = typeof i18n;
