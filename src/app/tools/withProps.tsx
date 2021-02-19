
import type React from "react";

export function withProps<P extends object, K extends keyof P>(
    Component: (props: P)=> ReturnType<React.FC>, 
    preInjectedProps: { [Key in K]: P[Key];}
) {

    const UntypedComponent: any= Component;

    return (props: { [Key in Exclude<keyof P, K>]: P[Key]; }) => 
        <UntypedComponent {...preInjectedProps} {...props} />;

}




