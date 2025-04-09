import { memo, useEffect, useState } from "react";
import { type StatefulReadonlyEvt, Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks";
import { useConst } from "powerhooks/useConst";

export function MyComponent() {
    const count = useCounter();

    const evtCount = useConst(() => Evt.create(count));

    useEffect(() => {
        evtCount.state = count;
    }, [count]);

    return <MyComponentInner evtCount={evtCount} />;
}

const MyComponentInner = memo((props: { evtCount: StatefulReadonlyEvt<number> }) => {
    const { evtCount } = props;

    // Mega cher

    return (
        <>
            Innner
            <MyComponentInner2 evtCount={evtCount} />
        </>
    );
});

const MyComponentInner2 = memo((props: { evtCount: StatefulReadonlyEvt<number> }) => {
    const { evtCount } = props;

    useRerenderOnStateChange(evtCount);

    const count = evtCount.state;

    return <h1>Count: {count}</h1>;
});

function useCounter() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setInterval(() => {
            setCount(count => count + 1);
        }, 1_000);
    }, []);

    return count;
}
