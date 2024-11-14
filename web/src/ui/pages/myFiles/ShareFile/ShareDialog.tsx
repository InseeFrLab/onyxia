import { declareComponentKeys } from "i18nifty";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { DirectoryOrFileDetailed } from "../shared/DirectoryOrFileDetailed";
import { Text } from "onyxia-ui/Text";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { tss } from "tss";
import { id } from "tsafe";
import { SelectTime } from "./SelectTime";
import { FileItem } from "../shared/types";
import { TextField } from "@mui/material";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";

export type ShareDialogProps = {
    file: FileItem;
    url: string | undefined; //undefined if file.policy is public
    isOpen: boolean;
    onClose: () => void;
    createSignedLink: (expirationTime: number) => Promise<string>;
};

export const ShareDialog = memo((props: ShareDialogProps) => {
    const { file, url } = props;
    const { t } = useTranslation({ ShareDialog });

    const { classes } = useStyles();
    const [isOpen, setIsOpen] = useState(true);
    const onClose = () => setIsOpen(false);

    const isPublic = file.policy === "public";

    const shareIconId = id<MuiIconComponentName>(
        isPublic ? "VisibilityOff" : "Visibility"
    );

    const [doCreateLink, setDoCreateLink] = useState(!isPublic); // If the file is private, we need to create a signed link

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

                    {doCreateLink ? (
                        <div className={classes.createLink}>
                            <SelectTime />
                            <Button
                                startIcon={id<MuiIconComponentName>("Language")}
                                variant="ternary"
                                onClick={() => setDoCreateLink(false)}
                            >
                                {t("create and copy link")}
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
                                expirationDate: undefined
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
                <>
                    <Button
                        autoFocus
                        doOpenNewTabIfHref={false}
                        onClick={onClose}
                        variant="primary"
                    >
                        {t("close")}
                    </Button>
                </>
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
