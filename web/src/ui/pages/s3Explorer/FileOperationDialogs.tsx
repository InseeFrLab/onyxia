import { useCallback, useEffect, useState } from "react";
import type { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { getCoreSync } from "core";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import {
    S3FileOperationDestinationDialog,
    S3RenameDialog
} from "ui/shared/codex/S3FileOperations";

export type FileOperationDialogsProps = {
    evtOpen: Evt<{ type: "copy" | "move" | "rename"; s3Uris: S3Uri[] }>;
    profileName: string | undefined;
    currentLocation: S3Uri | undefined;
};

export function FileOperationDialogs({
    evtOpen,
    profileName,
    currentLocation
}: FileOperationDialogsProps) {
    const [request, setRequest] = useState<{
        type: "copy" | "move" | "rename";
        s3Uris: S3Uri[];
        profileName: string;
        initialDestination: string;
    }>();
    const {
        functions: { s3ExplorerUiController }
    } = getCoreSync();
    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ type, s3Uris }) => {
                if (profileName === undefined || s3Uris.length === 0) return;
                const location = currentLocation ?? s3Uris[0];
                const parent =
                    !location.isDelimiterTerminated ||
                    s3Uris.some(
                        source => stringifyS3Uri(source) === stringifyS3Uri(location)
                    );
                setRequest({
                    type,
                    s3Uris,
                    profileName,
                    initialDestination: stringifyS3Uri({
                        ...location,
                        isDelimiterTerminated: true,
                        keySegments: parent
                            ? location.keySegments.slice(0, -1)
                            : location.keySegments
                    })
                });
            });
        },
        [evtOpen, profileName, currentLocation]
    );
    useEffect(() => {
        if (request !== undefined && request.profileName !== profileName)
            setRequest(undefined);
    }, [profileName, request]);
    const loadDirectories = useCallback(
        async (directory: string) => {
            assert(request !== undefined);
            const s3Uri = parseS3Uri({
                value: directory,
                delimiter: request.s3Uris[0].delimiter
            });
            assert(s3Uri.isDelimiterTerminated);
            const result = await s3ExplorerUiController.listFileOperationDestination({
                profileName: request.profileName,
                s3Uri
            });
            if (!result.isSuccess)
                throw new Error(
                    `${directory}: ${result.isKnownError ? result.errorCase : result.errorMessage}`
                );
            return result.prefixes.map(s3Uri => ({
                name: s3Uri.keySegments.at(-1) ?? s3Uri.bucket,
                uri: stringifyS3Uri(s3Uri)
            }));
        },
        [request]
    );
    if (request === undefined || request.profileName !== profileName) return null;
    const source = request.s3Uris[0];
    if (request.type === "rename")
        return (
            <S3RenameDialog
                isOpen
                name={source.keySegments.at(-1) ?? ""}
                isDirectory={source.isDelimiterTerminated}
                delimiter={source.delimiter}
                onClose={() => setRequest(undefined)}
                onConfirm={newBasename => {
                    setRequest(undefined);
                    void s3ExplorerUiController.rename({ s3Uri: source, newBasename });
                }}
            />
        );
    return (
        <S3FileOperationDestinationDialog
            isOpen
            operation={request.type}
            itemCount={request.s3Uris.length}
            initialDestination={request.initialDestination}
            delimiter={source.delimiter}
            sources={request.s3Uris.map(s3Uri => ({
                uri: stringifyS3Uri(s3Uri),
                isDirectory: s3Uri.isDelimiterTerminated
            }))}
            loadDirectories={loadDirectories}
            onClose={() => setRequest(undefined)}
            onConfirm={directory => {
                const destinationS3Uri = parseS3Uri({
                    value: directory,
                    delimiter: source.delimiter
                });
                assert(destinationS3Uri.isDelimiterTerminated);
                setRequest(undefined);
                void s3ExplorerUiController[request.type === "copy" ? "copy" : "move"]({
                    s3Uris: request.s3Uris,
                    destinationS3Uri
                });
            }}
        />
    );
}
