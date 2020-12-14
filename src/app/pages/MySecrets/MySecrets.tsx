import React from "react";
import { MySecretsHeader } from "./MySecretsHeader";
import { Typography } from "app/components/designSystem/Typography";
import { CircularProgress } from "app/components/designSystem/CircularProgress";
import { pure, thunks } from "lib/setup";
import { join as pathJoin } from "path";
import { Container } from "app/components/designSystem/Container";

import { useSelector, useDispatch } from "app/libHooks";




export function MySecrets() {

    const state = useSelector(state => state.secretExplorer);
    const dispatch = useDispatch();


    return (
        <>
            <MySecretsHeader />
            <Typography>{state.currentPath}</Typography>
            <Container maxWidth="sm">
                {(() => {
                    switch (state.state) {
                        case "FAILED": throw new Error(state.errorMessage);
                        case "LOADING": return <CircularProgress />;
                        case "LOADED": return (
                            <ExplorerItems
                                directories={state.directories}
                                files={state.secrets}
                                onEditedBasename={({ basename, editedBasename, kind }) =>
                                    console.log("TODO: Not implemented yet", { basename, editedBasename, kind })}
                                renameRequestBeingProcessed={undefined}
                                onOpen={
                                    ({ basename, kind }) => {

                                        if (kind === "file") {

                                            console.log("TODO: Not implemented yet");

                                            return;

                                        }


                                        dispatch(
                                            thunks.secretExplorer.navigateToPath(
                                                { "path": pathJoin(state.currentPath, basename) }
                                            )
                                        );

                                    }
                                }

                            />
                        );
                    }

                })()})
            </Container>
        </>
    );
};