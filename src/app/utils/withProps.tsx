
import React from "react";

export function withProps<P extends object, K extends keyof P>(
    Component: (props: P)=> ReturnType<React.FC>, 
    preInjectedProps: { [Key in K]: P[Key];}
) {

    const Component_: any= Component;

    return (props: { [Key in Exclude<keyof P, K>]: P[Key]; }) => <Component_ {...preInjectedProps} {...props} />;

}



