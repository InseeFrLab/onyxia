import { Provider } from "react-redux";
import { refStore } from "core/setup";
import type { ReactNode } from "react";

export type Props = {
    children: ReactNode;
};

/** @deprecated */
export function StoreProvider(props: Props) {
    const { children } = props;

    return <Provider store={refStore.current as any}>{children}</Provider>;
}
