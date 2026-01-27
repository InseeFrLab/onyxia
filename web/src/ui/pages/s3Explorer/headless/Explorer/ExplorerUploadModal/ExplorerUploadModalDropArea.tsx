import { useState, memo } from "react";
import type { DragEvent } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { ExplorerIcon } from "../ExplorerIcon/ExplorerIcon";
import { useTranslation } from "ui/i18n";
import Link from "@mui/material/Link";
import { InputFile } from "ui/tools/InputFile";
import type { InputFileProps } from "ui/tools/InputFile";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert, is } from "tsafe/assert";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { declareComponentKeys } from "i18nifty";
import { Deferred } from "evt/tools/Deferred";
import { join as pathJoin } from "pathe";

export type Props = {
    className?: string;
    onRequestFilesUpload: (params: {
        files: {
            directoryRelativePath: string;
            basename: string;
            blob: Blob;
        }[];
    }) => void;
};

export const ExplorerUploadModalDropArea = memo((props: Props) => {
    const [isDragHover, setIsDragHover] = useState(false);

    const { className, onRequestFilesUpload } = props;

    const { classes, cx } = useStyles({ isDragHover });

    const { t } = useTranslation({ ExplorerUploadModalDropArea });

    const evtInputFileAction = useConst(() =>
        Evt.create<UnpackEvt<InputFileProps["evtAction"]>>()
    );

    const onBrowseFileClick = useConstCallback(() => evtInputFileAction.post("TRIGGER"));

    const callbackFactory = useCallbackFactory(
        async (
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

            async function traverse(params: {
                entry: FileSystemEntry;
                directoryRelativePath: string;
            }): Promise<
                {
                    directoryRelativePath: string;
                    basename: string;
                    blob: Blob;
                }[]
            > {
                const { entry, directoryRelativePath } = params;

                if (entry.isFile) {
                    assert(is<FileSystemFileEntry>(entry));

                    const dBlob = new Deferred<Blob>();

                    entry.file(
                        file => dBlob.resolve(file),
                        error => dBlob.reject(error)
                    );

                    const blob = await dBlob.pr;

                    return [
                        {
                            directoryRelativePath,
                            basename: entry.name,
                            blob
                        }
                    ];
                }

                if (entry.isDirectory) {
                    assert(is<FileSystemDirectoryEntry>(entry));

                    const directoryRelativePath_next = pathJoin(
                        directoryRelativePath,
                        entry.name
                    );

                    const dEntries_next = new Deferred<FileSystemEntry[]>();

                    entry.createReader().readEntries(
                        entries => dEntries_next.resolve(entries),
                        error => dEntries_next.reject(error)
                    );

                    const entries_next = await dEntries_next.pr;

                    return (
                        await Promise.all(
                            entries_next.map(entry =>
                                traverse({
                                    directoryRelativePath: directoryRelativePath_next,
                                    entry: entry
                                })
                            )
                        )
                    ).flat();
                }

                return [];
            }

            const files = (
                await Promise.all(
                    Array.from(event.dataTransfer.items)
                        .map(item => item.webkitGetAsEntry())
                        .filter(entry => entry !== null)
                        .map(entry =>
                            traverse({
                                directoryRelativePath: ".",
                                entry
                            })
                        )
                )
            ).flat();

            onRequestFilesUpload({ files });
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
            <InputFile
                evtAction={evtInputFileAction}
                onRequestFilesUpload={({ files }) =>
                    onRequestFilesUpload({
                        files: files.map(({ basename, blob }) => ({
                            directoryRelativePath: ".",
                            basename,
                            blob
                        }))
                    })
                }
            />
        </div>
    );
});

const { i18n } = declareComponentKeys<"drag and drop or" | "browse files">()({
    ExplorerUploadModalDropArea
});
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ ExplorerUploadModalDropArea })
    .withParams<{ isDragHover: boolean }>()
    .create(({ theme, isDragHover }) => ({
        root: {
            outline: `${isDragHover ? 3 : 1}px ${
                theme.colors.useCases.buttons[
                    isDragHover ? "actionActive" : "actionDisabled"
                ]
            } dashed`,
            borderRadius: theme.spacing(3),
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
            ...theme.spacing.topBottom("padding", 7)
        },
        innerDiv: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
        },
        explorerIcon: {
            height: 60,
            marginBottom: theme.spacing(5)
        },
        link: {
            cursor: "pointer"
        }
    }));
