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
import { assert } from "tsafe/assert";
import { CircularProgress } from "onyxia-ui/CircularProgress";

export type ShareDialogProps = ShareDialogProps.Close | ShareDialogProps.Open;
export namespace ShareDialogProps {
    type Common = {
        onClose: () => void;
    };

    export type Close = Common & {
        isOpen: false;
    };

    export type Open = Common & {
        isOpen: true;
        file: FileItem;
    } & BodyProps;

    export type BodyProps = BodyProps.PrivateFileProps | BodyProps.PublicFileProps;

    export namespace BodyProps {
        export type PrivateFileProps = {
            isPublic: false; // Clé discriminante
            url: string | undefined;
            isRequestingUrl: boolean;
            validityDurationSecondOptions: number[];
            validityDurationSecond: number;
            onRequestUrl: (params: { expirationTime: number }) => void;
        };

        export type PublicFileProps = {
            isPublic: true; // Clé discriminante
            url: string;
        };
    }
}

export const ShareDialog = memo((props: ShareDialogProps) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation({ ShareDialog });

    const { classes } = useStyles();

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            body={isDialogOpen(props) ? <ShareDialogBody {...props} /> : null}
            title={t("title")}
            subtitle={
                isOpen && (
                    <DirectoryOrFileDetailed
                        name={props.file.basename}
                        kind={props.file.kind}
                        isPublic={props.isPublic}
                        className={classes.directoryDetails}
                    />
                )
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

const ShareDialogBody = memo((props: ShareDialogProps.BodyProps) => {
    const { t } = useTranslation({ ShareDialog });
    const { classes } = useStyles();

    const { isPublic, url } = props;

    const [valueExpirationTime, setValueExpirationTime] = useState<number | undefined>(
        isPrivateFileProps(props) ? props.validityDurationSecond : undefined
    );

    return (
        <div className={classes.body}>
            <Text typo="label 1">{t("paragraph current policy", { isPublic })}</Text>

            <Text typo="body 1">{t("paragraph change policy", { isPublic })}</Text>

            {isPrivateFileProps(props) && url === undefined
                ? (() => {
                      assert(valueExpirationTime !== undefined); // Assure TypeScript que valueExpirationTime est défini ici
                      return (
                          <div className={classes.createLink}>
                              <SelectTime
                                  expirationValue={valueExpirationTime}
                                  validityDurationSecondOptions={
                                      props.validityDurationSecondOptions
                                  }
                                  onExpirationValueChange={setValueExpirationTime}
                              />
                              <div className={classes.createLinkButton}>
                                  <Button
                                      startIcon={getIconUrlByName("Language")}
                                      variant="ternary"
                                      onClick={() =>
                                          props.onRequestUrl({
                                              expirationTime: valueExpirationTime
                                          })
                                      }
                                      disabled={props.isRequestingUrl}
                                  >
                                      {t("create and copy link")}
                                  </Button>
                                  {props.isRequestingUrl && (
                                      <CircularProgress
                                          className={classes.createLinkProgress}
                                      />
                                  )}
                              </div>
                          </div>
                      );
                  })()
                : (() => {
                      assert(url !== undefined); // Assure TypeScript que url est défini ici
                      return (
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
                                  isPublic,
                                  expiration: undefined // TODO improve
                              })}
                              variant="standard"
                              value={url}
                          />
                      );
                  })()}
        </div>
    );
});

function isDialogOpen(props: ShareDialogProps): props is ShareDialogProps.Open {
    return props.isOpen;
}

function isPrivateFileProps(
    props: ShareDialogProps.BodyProps
): props is ShareDialogProps.BodyProps.PrivateFileProps {
    return !props.isPublic;
}

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
    },
    createLinkProgress: {
        position: "absolute"
    },
    createLinkButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
    }
}));
const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | "create and copy link"
    | { K: "paragraph current policy"; P: { isPublic: boolean } }
    | { K: "paragraph change policy"; P: { isPublic: boolean } }
    | {
          K: "hint link access";
          P: { isPublic: boolean; expiration: string | undefined };
      }
    | "label input link"
>()({
    ShareDialog
});
export type I18n = typeof i18n;
