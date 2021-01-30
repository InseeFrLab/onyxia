
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";
import { withProps } from "../withProps";

/**
 * Assert: The number of properties in preInjectedProps is constant
 */
export const useWithProps: typeof withProps = (Component, preInjectedProps) => {

    return useSemanticGuaranteeMemo(
        () => withProps(
            Component,
            preInjectedProps
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        objectKeys(preInjectedProps).map(key => preInjectedProps[key])
    );

}