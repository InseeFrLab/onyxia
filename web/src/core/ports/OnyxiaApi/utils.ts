import memoize from "memoizee";

export const getRandomK8sSubdomain = memoize(
    () => `${Math.floor(Math.random() * 1000000)}`
);

export function getServiceId(params: {
    packageName: string;
    randomK8sSubdomain: string;
}) {
    const { packageName, randomK8sSubdomain } = params;
    const serviceId = `${packageName}-${randomK8sSubdomain}`;
    return { serviceId };
}
