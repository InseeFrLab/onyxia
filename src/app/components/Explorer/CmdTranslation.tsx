
import { useState, useReducer } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import memoize from "memoizee";
import { id } from "evt/tools/typeSafety/id";
import Box from "@material-ui/core/Box";

export type Props = {
    evtTranslation: NonPostableEvt<{
        type: "cmd" | "result";
        cmdId: number;
        translation: string;
    }>;
};

export function CmdTranslation(props: Props) {

    const { evtTranslation } = props;

    const [getEntries] = useState(
        () => memoize(
            (_evtTranslation: Props["evtTranslation"]) => ({
                "entries": id<{
                    cmdId: number;
                    cmd: string;
                    resp: string | undefined;
                }[]>([])
            })
        )
    );

    const { entries } = getEntries(evtTranslation);

    const [, forceUpdate] = useReducer(x => x + 1, 0);

    useEvt(
        ctx => {

            evtTranslation.attach(
                ({ type }) => type === "cmd",
                ctx,
                ({ cmdId, translation }) => {

                    entries.push({
                        cmdId,
                        "cmd": translation,
                        "resp": undefined
                    });

                    forceUpdate();

                    evtTranslation.attach(
                        translation => translation.cmdId === cmdId,
                        ctx,
                        ({ translation }) => {

                            entries
                                .find(entry => entry.cmdId === cmdId)!
                                .resp = translation;

                            forceUpdate();

                        }
                    );

                }
            );

        },
        [entries, evtTranslation]
    );

    return (
        <>
            {entries.map(
                ({ cmdId, cmd, resp }) =>
                    <Box key={cmdId}>
                        <Code code={cmd} isGreen={true} />
                        <Code
                            code={resp === undefined ? "Pending result..." : resp}
                            isGreen={false}
                        />
                    </Box>
            )}
        </>
    );

}

function Code(props: { code: string; isGreen: boolean; }) {
    const { code, isGreen } = props;
    return (
        <Box>
            <pre style={{ "color": isGreen ? "#95c206" : undefined }}>
                {code.replace(/["{[,}\]]/g, "")}
            </pre>
        </Box>
    );
}