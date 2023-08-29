import { useState, memo } from "react";
import type { DragEvent } from "react";
import { tss, Text } from "ui/theme";
import { ExplorerIcon } from "../ExplorerIcon";
import { useTranslation } from "ui/i18n";
import Link from "@mui/material/Link";
import { InputFile } from "ui/tools/InputFile";
import type { InputFileProps } from "ui/tools/InputFile";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert } from "tsafe/assert";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    onFileSelected: InputFileProps["onFileSelected"];
};

export const ExplorerUploadModalDropArea = memo((props: Props) => {
    const [isDragHover, setIsDragHover] = useState(false);

    const { className, onFileSelected } = props;

    const { classes, cx } = useStyles({ isDragHover });

    const { t } = useTranslation({ ExplorerUploadModalDropArea });

    const evtInputFileAction = useConst(() =>
        Evt.create<UnpackEvt<InputFileProps["evtAction"]>>()
    );

    const onBrowseFileClick = useConstCallback(() => evtInputFileAction.post("TRIGGER"));

    const callbackFactory = useCallbackFactory(
        (
            [callbackId]: ["drop" | "dragEnter" | "dragLeave" | "dragOver"],
            [event]: [DragEvent<HTMLDivElement>]
        ) => {
            event.preventDefault();
            event.stopPropagation();

            setIsDragHover(
                (() => {
                    switch (callbackId) {
                        case "dragEnter":
                            return true;
                        case "dragLeave":
                            return false;
                        case "dragOver":
                            return true;
                        case "drop":
                            return false;
                    }
                })()
            );

            if (callbackId !== "drop") {
                return;
            }

            assert(event.type === "drop");

            onFileSelected({ "files": Object.values(event.dataTransfer.files) });
        }
    );

    return (
        <div
            className={cx(classes.root, className)}
            onDrop={callbackFactory("drop")}
            onDragEnter={callbackFactory("dragEnter")}
            onDragLeave={callbackFactory("dragLeave")}
            onDragOver={callbackFactory("dragOver")}
        >
            <div className={classes.innerDiv}>
                <ExplorerIcon
                    className={classes.explorerIcon}
                    iconId="data"
                    hasShadow={true}
                />
                <Text typo="body 1">
                    {t("drag and drop or")}
                    &nbsp;
                    <Link
                        className={classes.link}
                        underline="hover"
                        onClick={onBrowseFileClick}
                    >
                        {t("browse files")}
                    </Link>
                </Text>
            </div>
            <InputFile evtAction={evtInputFileAction} onFileSelected={onFileSelected} />
        </div>
    );
});

export const { i18n } = declareComponentKeys<"drag and drop or" | "browse files">()({
    ExplorerUploadModalDropArea
});

const useStyles = tss
    .withParams<{ isDragHover: boolean }>()
    .withName({ ExplorerUploadModalDropArea })
    .create(({ theme, isDragHover }) => ({
        "root": {
            "outline": `${isDragHover ? 3 : 1}px ${
                theme.colors.useCases.buttons[
                    isDragHover ? "actionActive" : "actionDisabled"
                ]
            } dashed`,
            "borderRadius": theme.spacing(3),
            "display": "flex",
            "justifyContent": "center",
            "alignItems": "center",
            "boxSizing": "border-box",
            ...theme.spacing.topBottom("padding", 7)
        },
        "innerDiv": {
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "center"
        },
        "explorerIcon": {
            "height": 60,
            "marginBottom": theme.spacing(5)
        },
        "link": {
            "cursor": "pointer"
        }
    }));
