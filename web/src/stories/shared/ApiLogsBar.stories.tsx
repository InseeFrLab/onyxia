import { css } from "@emotion/css";
import { useState, useEffect, useReducer } from "react";
import { getStoryFactory } from "stories/getStory";
import { sectionName } from "./sectionName";
import { CommandBar } from "ui/shared/CommandBar";
import type { CommandBarProps } from "ui/shared/CommandBar";
import { symToStr } from "tsafe/symToStr";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { id } from "tsafe/id";
import { useEvt } from "evt/hooks/useEvt";
import type { CommandLogs } from "core/tools/commandLogger";

const translationsEvents: UnpackEvt<CommandLogs["evt"][]> = [
    {
        "cmdId": 0,
        "type": "cmd",
        "cmdOrResp":
            "vault write auth/jwt/login role=onyxia-user jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpvaG4uZG9lQGluc2VlLmZyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZG9laiIsImdpdGxhYl9ncm91cCI6bnVsbCwibmFtZSI6IiJ9.eAs8RQ_lfvjh_qYZtRYO9qp7VI6TLwWrRLd3Xr3Yt8g"
    },
    {
        "cmdId": 0,
        "type": "result",
        "cmdOrResp": `Success! You are now authenticated!`
    },
    {
        "cmdId": 1,
        "type": "cmd",
        "cmdOrResp": "vault kv list onyxia-kv/doej"
    },
    {
        "cmdId": 1,
        "type": "result",
        "cmdOrResp": [
            "Keys",
            "----",
            ".onyxia/",
            "dossier_test/",
            "secret_sans_nom",
            "untitled_secret"
        ].join("\n")
    },
    {
        "cmdId": 2,
        "type": "cmd",
        "cmdOrResp": "vault kv get onyxia-kv/doej/.onyxia/userServicePassword"
    },
    {
        "cmdId": 2,
        "type": "result",
        "cmdOrResp": [
            "==== Data ====",
            "Key    Value",
            "---    -----",
            "value  01xlcu1hg4wxzib08xe4"
        ].join("\n")
    },
    {
        "cmdId": 3,
        "type": "cmd",
        "cmdOrResp": "cmd 3"
    },
    {
        "cmdId": 4,
        "type": "cmd",
        "cmdOrResp": "cmd 4"
    },
    {
        "cmdId": 3,
        "type": "result",
        "cmdOrResp": "result of cmd 3"
    },
    {
        "cmdId": 4,
        "type": "result",
        "cmdOrResp": "result of cmd 4"
    },
    {
        "cmdId": 5,
        "type": "cmd",
        "cmdOrResp": "cmd 5"
    },
    {
        "cmdId": 5,
        "type": "result",
        "cmdOrResp": "result of cmd 5"
    },
    {
        "cmdId": 6,
        "type": "cmd",
        "cmdOrResp": "cmd 6"
    },
    {
        "cmdId": 6,
        "type": "result",
        "cmdOrResp": "result of cmd 6"
    }
];

function useFakeCommandLogs(params: {
    /** Toggle to fire a translation event */
    tick: boolean;
}): CommandLogs {
    const { tick } = params;

    const [index, incrementIndex] = useReducer(
        (index: number) => (index === translationsEvents.length - 1 ? index : index + 1),
        0
    );

    useEffect(() => {
        incrementIndex();
    }, [tick]);

    const [commandLogs] = useState(() => ({
        "evt": Evt.create<UnpackEvt<CommandLogs["evt"]>>(),
        "history": id<CommandLogs["history"][number][]>([])
    }));

    useEvt(
        ctx =>
            commandLogs.evt.attach(
                ({ type }) => type === "cmd",
                ctx,
                ({ cmdId, cmdOrResp }) => {
                    commandLogs.history.push({
                        cmdId,
                        "cmd": cmdOrResp,
                        "resp": undefined
                    });

                    commandLogs.evt.attachOnce(
                        translation => translation.cmdId === cmdId,
                        ctx,
                        ({ cmdOrResp }) =>
                            (commandLogs.history.find(
                                entry => entry.cmdId === cmdId
                            )!.resp = cmdOrResp)
                    );
                }
            ),
        []
    );

    useEffect(() => {
        commandLogs.evt.postAsyncOnceHandled(translationsEvents[index]);
    }, [index]);

    return commandLogs;
}

function Component(
    props: Omit<CommandBarProps, "className" | "entries"> & {
        width: number;
        maxHeight: number;
        /** Toggle to fire a translation event */
        tick: boolean;
    }
) {
    const { tick, maxHeight, width } = props;

    const commandLogs = useFakeCommandLogs({ tick });

    const [entries, setEntries] = useState<CommandBarProps["entries"]>([]);

    useEvt(
        ctx => {
            commandLogs.evt
                .toStateful(ctx)
                .attach(() => setEntries([...commandLogs.history]));
        },
        [commandLogs]
    );

    return (
        <CommandBar
            className={css({
                "border": "1px solid black",
                width
            })}
            entries={entries}
            maxHeight={maxHeight}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ CommandBar })]: Component }
});

export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920,
                "step": 10
            }
        },
        "maxHeight": {
            "control": {
                "type": "range",
                "min": 100,
                "max": 1080,
                "step": 10
            }
        },
        "tick": {
            "control": {
                "type": "boolean"
            }
        }
    }
};

export const View1 = getStory({
    "width": 800,
    "maxHeight": 350,
    "tick": true
});
