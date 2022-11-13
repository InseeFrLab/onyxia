import { Service, Group } from "js/model";
import { restApiPaths } from "js/restApiPaths";
import memoize from "memoizee";

/** We avoid importing app right away to prevent require cycles */
const getAxiosInstance = memoize(
    () => import("core/adapters/officialOnyxiaApiClient").then(ns => ns.prAxiosInstance),
    {
        "promise": true
    }
);

interface ServicesListing {
    apps: Service[];
    groups: Group[];
}

export const getServices = async (groupId?: String) => {
    return await (
        await getAxiosInstance()
    )
        .get<ServicesListing>(restApiPaths.myServices, {
            params: {
                groupId: groupId
            }
        })
        .then(({ data }) => data);
};

export const getService = async (id: string) => {
    return await (
        await getAxiosInstance()
    )
        .get<Service>(restApiPaths.getService, {
            params: {
                serviceId: id
            }
        })
        .then(({ data }) => data);
};

export const deleteServices = async (path?: string, bulk?: boolean) => {
    if (path && bulk && !path.startsWith("/")) {
        path = "/" + path;
    }
    return (await getAxiosInstance())
        .delete(`${restApiPaths.deleteService}`, {
            params: {
                path: path,
                bulk: bulk
            }
        })
        .then(({ data }) => data);
};

export const getLogs = async (serviceId: string, taskId: string) => {
    return await (
        await getAxiosInstance()
    )
        .get<string>(restApiPaths.getLogs, {
            params: {
                serviceId: serviceId,
                taskId: taskId
            }
        })
        .then(({ data }) => data);
};
