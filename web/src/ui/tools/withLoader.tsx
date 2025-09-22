import { useEffect, useState, type ComponentType, type FC } from "react";
import { use } from "./use";
import { assert } from "tsafe";

export function withLoader<Props extends Record<string, unknown>>(params: {
    loader: () => Promise<void>;
    Component: ComponentType<Props>;
    FallbackComponent?: ComponentType<Props>;
}): FC<Props> {
    const { loader, Component, FallbackComponent } = params;

    let prLoaded: Promise<void> | undefined = undefined;

    function ComponentWithLoader_Fallback(props: Props) {
        const [isLoaded, setIsLoaded] = useState(false);

        if (prLoaded === undefined) {
            prLoaded = loader();
        }

        useEffect(() => {
            let isActive = true;

            (prLoaded ??= loader()).then(() => {
                if (!isActive) {
                    return;
                }
                setIsLoaded(true);
            });

            return () => {
                isActive = false;
                prLoaded = undefined;
            };
        }, []);

        if (!isLoaded) {
            assert(FallbackComponent !== undefined);
            return <FallbackComponent {...props} />;
        }

        return <Component {...props} />;
    }

    function ComponentWithLoader_Suspense(props: Props) {
        useEffect(() => {
            return () => {
                prLoaded = undefined;
            };
        }, []);

        use(
            (prLoaded ??= (async () => {
                await Promise.resolve();
                await loader();
                await Promise.resolve();
            })())
        );

        return <Component {...props} />;
    }

    const ComponentWithLoader =
        FallbackComponent !== undefined
            ? ComponentWithLoader_Fallback
            : ComponentWithLoader_Suspense;

    // @ts-expect-error: We know what we are doing
    ComponentWithLoader.displayName = `${
        Component.displayName ?? Component.name ?? "Component"
    }WithLoader`;

    return ComponentWithLoader;
}
