import React, { useMemo, useState } from "react";
import { Dialog } from "app/components/designSystem/Dialog";
import { DialogTitle } from "../designSystem/DialogTitle";
import { DialogContent } from "app/components/designSystem/DialogContent";
import { DialogActions } from "app/components/designSystem/DialogActions";
import { Button } from "app/components/designSystem/Button";
import { TextField } from "app/components/designSystem/TextField";
import { symToStr } from "app/utils/symToStr";
import { useTranslation } from "app/i18n/useTranslations";
import memoize from "memoizee";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

export type Props = {
  /** [HIGHER ORDER] */
  wordForFile: "file" | "secret";

  successCallback(params: { kind: "file" | "directory", basename: string; }): void;
  getIsValidBasename(params: { kind: "file" | "directory", basename: string; }): boolean;

  evtAction: NonPostableEvt<{ action: "OPEN"; kind: "file" | "directory"; }>;

};

export function ExplorerItemCreationDialog(props: Props) {

  const { wordForFile, successCallback, getIsValidBasename, evtAction } = props;

  const { t } = useTranslation("ExplorerItemCreationDialog");

  const [basename, setBasename] = useState("");

  const [kind, setKind] = useState<"file" | "directory">("file");

  const isValidBasename = useMemo(() => getIsValidBasename({ kind, basename }), [basename, kind, getIsValidBasename]);

  const [isOpen, setIsOpen] = useState(false);

  const onCloseFactory = useMemo(
    () => memoize(
      (doCreate: boolean) =>
        () => {

          setBasename("");

          setIsOpen(false);

          if (!doCreate) {
            return;
          }

          successCallback({ kind, basename });


        }
    ),
    [successCallback, kind, basename]
  );

  useEvt(
    ctx => evtAction.$attach(
      data => data.action !== "OPEN" ? null : [data],
      ctx,
      ({ kind }) => {
        setKind(kind);
        setIsOpen(true);
      }
    ),
    [evtAction]
  );


  return (
    <Dialog open={isOpen} onClose={onCloseFactory(false)} aria-labelledby={titleId}>
      <DialogTitle
        id={titleId}
        subtitle={(() => {
          switch (kind) {
            case "directory": return t("sort out your", { "what": t(wordForFile) })
            case "file": return null;
          }
        })()}
      >
        {t("create new", { "what": t(kind) })}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label={t("name of the", {
            "what": t((() => {
              switch (kind) {
                case "directory": return "directory";
                case "file": return wordForFile;
              }
            })())
          })}
          fullWidth
          error={!isValidBasename}
          onChange={setBasename}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCloseFactory(false)}
          color="secondary"
          disabled={!isValidBasename}
        >
          Cancel
          </Button>
        <Button onClick={onCloseFactory(true)} color="primary">
          Subscribe
          </Button>
      </DialogActions>
    </Dialog>
  );


}

export declare namespace ExplorerItemCreationDialog {

  export type I18nScheme = {
    file: undefined,
    secret: undefined,
    directory: undefined,
    create: undefined,
    cancel: undefined,
    'create new': { what: string; };
    'sort out your': { what: string; };
    'name of the': { what: string; };
  };

}

//NOTE: Could be anything, just need to be uniq across the DOM.
const titleId = symToStr({ ExplorerItemCreationDialog });



