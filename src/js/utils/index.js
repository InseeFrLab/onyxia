export { default as getKeycloak } from "./keycloak-config";
export * from "./axios-config";
export * from "./storage-token";
export * from "./service-utils";
export * from "./state-tasks";
export * from "./fil-d-ariane-utils";
export * from "./token-local-storage";
export { default as typeRequest } from "./mes-services-types-request";
import conf from "../configuration";

const grafanaBaseUri = conf.FOOTER.grafana;
const grafanaBaseUri = conf.APP.grafana - uri;

const makeParamFromIdService = id =>
  id
    .split("/")
    .filter(s => s.trim().length > 0)
    .join("_");

export const getGrafanaServiceUrl = service =>
  `${grafanaBaseUri}${makeParamFromIdService(service.id)}`;

export const extractServiceId = serviceId =>
  serviceId
    .split("/")
    .filter(a => a && a.length > 0)
    .filter((a, i) => i > 1)
    .reduce((a, m) => (a ? `${a}/${m}` : m), null)
    .replace("/", "%2F");
export const extractGroupId = serviceId =>
  getAvLast(extractServiceId(serviceId).split("/")).reduce(
    (a, r) => `${a}/${r}`,
    ""
  );

const getAvLast = ([first, ...rest]) =>
  rest.length === 0
    ? []
    : rest.length === 1
      ? [first]
      : [first, ...getAvLast(rest)];

export const getParamsFromProps = props =>
  props.match && props.match.params ? props.match.params : undefined;
