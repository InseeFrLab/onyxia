import { useState, useEffect } from "react";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";

type PropsBase = { location: string };

export function createAiguilleur<
    LeafProps extends PropsBase,
    NodeProps extends PropsBase,
    RootProps extends PropsBase
>({
    Leaf,
    Node,
    Root = () => null,
    isLeaf = () => Promise.resolve(false),
    isRoot = () => Promise.resolve(false)
}: {
    Leaf: React.FC<LeafProps>;
    Node: React.FC<NodeProps>;
    Root: React.FC<RootProps>;
    isLeaf?: (location: Location) => Promise<boolean>;
    isRoot?: (location: Location) => Promise<boolean>;
}): React.FC<
    Omit<LeafProps & NodeProps & RootProps, "location"> & { location: Location }
> {
    return props => {
        const [location, setLocation] = useState(props.location.pathname);
        const [isRoot_, setIsRoot] = useState(false);
        const [isLeaf_, setIsLeaf] = useState(false);
        const [init, setInit] = useState(false);
        const current = window.location.pathname;

        useEffect(() => {
            let unmount = false;
            const verify = async () => {
                const isLeaf__ = await isLeaf(window.location);
                const isRoot__ = await isRoot(window.location);
                if (unmount) {
                    return;
                }
                setLocation(window.location.pathname);
                setIsLeaf(isLeaf__);
                setIsRoot(isRoot__);
                setInit(true);
            };
            if (!init || location !== current) {
                verify();
            }
            return () => {
                unmount = true;
            };
        }, [init, current, location]);

        const p: LeafProps & NodeProps & RootProps = {
            ...props,
            location
        } as any;

        return !init ? null : (
            <LegacyThemeProvider>
                {isRoot_ ? <Root {...p} /> : isLeaf_ ? <Leaf {...p} /> : <Node {...p} />}
            </LegacyThemeProvider>
        );
    };
}
