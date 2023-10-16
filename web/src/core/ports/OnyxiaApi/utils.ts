import memoize from "memoizee";

//TODO: Refactor this, it's an incredibly convoluted design

export const getRandomK8sSubdomain = memoize(
    () => `${Math.floor(Math.random() * 1000000)}`
);

export function getServiceId(params: { chartName: string; randomK8sSubdomain: string }) {
    const { chartName, randomK8sSubdomain } = params;
    const serviceId = `${chartName}-${randomK8sSubdomain}`;
    return { serviceId };
}
