
import { createUseScopedState } from "powerhooks";
import { Evt } from "evt";
import { useReducer } from "react";
import type { ReactNode } from "react";
import { useAsync } from "react-async-hook";
import { useEvt } from "evt/hooks";
import memoize from "memoizee";
import publicIp from "public-ip";

/** Memoized, can be called to pre fetch the IP */
export const getPublicIp = memoize(
    () => publicIp.v4().catch(() => "0.0.0.0"),
    { "promise": true }
);

const wrap = createUseScopedState<string, "publicIp">("publicIp");

export function PublicIpProvider(props: { children: ReactNode; }) {

    const { children } = props;

    const [counter, incrementCounter] = useReducer((count: number) => count + 1, 0);

    useEvt(
        () => Evt.from(window, "online")
            .attach(() => {
                getPublicIp.clear();
                incrementCounter();
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { result: publicIp } = useAsync(
        () => getPublicIp(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [counter]
    );

    return (
        publicIp === undefined ?
            null :
            <wrap.PublicIpProvider initialState={publicIp}>
                {children}
            </wrap.PublicIpProvider>
    );

}

export const usePublicIp: () => { publicIp: string; } = wrap.usePublicIp;




