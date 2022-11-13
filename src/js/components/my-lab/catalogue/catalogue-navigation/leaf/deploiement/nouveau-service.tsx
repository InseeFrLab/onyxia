import { getDefaultSingleOption } from "js/universe/universeContractFiller";
import { mustacheRender } from "js/utils";
import { restApiPaths } from "js/restApiPaths";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
//import { useDispatch, useIsBetaModeEnabled, useAppConstants } from "core";
//import { useMustacheParams } from "js/hooks";
import type { BuildOnyxiaValue } from "js/utils/form-field";
import { prAxiosInstance } from "core/adapters/officialOnyxiaApiClient";

type Service = {
    category: "group" | "service";
    catalogId: string;
    name: string;
    currentVersion: number;
    postInstallNotes?: string;
    config: { properties: Record<string, Onglet> };
};

export type Props = {
    idCatalogue: string;
    idService: string;
};

type Onglet = {
    description?: string;
    properties: Record<
        string,
        {
            type: "boolean" | "number" | "string" | "object";
            properties: {
                path: string;
                field: Omit<Onglet["properties"][string], "type"> & {
                    nom: string;
                    type: Onglet["properties"][string]["type"] | "select";
                    options: string[];
                };
            }[];
            enum: string[];
            title: string;
        }
    >;
};

const getOnglets = (onglets: Record<string, Onglet>) =>
    Object.entries(onglets)
        .map(([nom, onglet]) => mapOngletToFields(nom)(onglet))
        .filter(o => o.fields && o.fields.length > 0);

const escapeDots = (str: string) => str.replace(/\./g, "\\.");

const mapOngletToFields = (nom: string) => (onglet: Onglet) => ({
    nom: nom,
    description: onglet.description || "Cet onglet ne possède pas de description.",
    fields: getFields(escapeDots(nom))(onglet.properties),
});

const getFields = (nom: string) => (ongletProperties: Onglet["properties"]) => {
    if (!ongletProperties) {
        return;
    }
    const fields: Onglet["properties"][string]["properties"] = [];

    Object.entries(ongletProperties).forEach(([key, entry]) => {
        const { type, properties, enum: options, title } = entry;
        const path = `${nom}.${escapeDots(key)}`;

        switch (type) {
            case "boolean":
            case "number":
            case "string":
                fields.push({
                    path,
                    field: {
                        ...entry,
                        type: options && options.length > 0 ? "select" : type,
                        nom: title || key,
                        options: options,
                    },
                });
                break;
            case "object":
                const fieldsToAdd = getFields(path)(properties as any);

                assert(fieldsToAdd !== undefined);

                fields.push(...fieldsToAdd);

                break;
            default:
                break;
        }
    });

    return fields;
};

const arrayToObject =
    (queryParams: Record<string, string>) =>
    (buildOnyxiaValue: BuildOnyxiaValue) =>
    (
        fields: {
            path: string;
            field: { "js-control": string; type: string };
        }[],
    ) => {
        const obj: Record<string, any> = {};
        const fromParams = getFromQueryParams(queryParams);
        fields.forEach(
            ({ path, field }) =>
                (obj[path] =
                    fromParams(path)(field) ??
                    (mustacheRender(field as any, buildOnyxiaValue) ||
                        getDefaultSingleOption(field))),
        );
        return obj;
    };

const getFromQueryParams =
    (queryParams: Record<string, string>) =>
    (path: string) =>
    ({ "js-control": jsControl, type }: { "js-control": string; type: string }) => {
        if (jsControl === "ro") {
            return undefined;
        }

        if (!(path in queryParams)) {
            return undefined;
        }

        const value = queryParams[path];

        switch (type) {
            case "boolean":
                return value === "true";
            case "number":
                return Number.parseFloat(value);
            default:
                return value;
        }
    };

/*
 * Fonctions permettant de remettre en forme les valeurs
 * de champs comme attendu par l'api.
 */
export const getValuesObject = (
    fieldsValues: Record<string, string | boolean | number>,
) =>
    Object.entries(fieldsValues)
        .map(([key, value]) => ({
            "path": key
                //NOTE the two next pipe mean "split all non escaped dots"
                //the regular expression 'look behind' is not supported by Safari.
                .split(".")
                .reduce<string[]>(
                    (prev, curr) =>
                        prev[prev.length - 1]?.endsWith("\\")
                            ? ((prev[prev.length - 1] += `.${curr}`), prev)
                            : [...prev, curr],
                    [],
                )
                .map(s => s.replace(/\\\./g, ".")),
            value,
        }))
        .reduce(
            (acc, curr) => ({ ...acc, ...getPathValue(curr)(acc) }),
            id<Record<string, string | boolean | number>>({}),
        );

const getPathValue =
    ({
        path: [first, ...rest],
        value,
    }: {
        path: string[];
        value: string | boolean | number;
    }) =>
    (
        other = id<Record<string, string | boolean | number>>({}),
    ): Record<string, string | boolean | number> => {
        if (rest.length === 0) {
            return { [first]: value, ...other };
        }
        return {
            ...other,
            [first]: getPathValue({ path: rest, value })(other[first] as any) as any,
        };
    };

export const getOptions = (
    buildMustacheParams: BuildOnyxiaValue,
    service: Service,
    queryParams: Record<string, string>,
) => {
    const onglets = (service && service.config && service.config.properties) || {};
    const oF = getOnglets(onglets);
    const fields = oF.map(onglet => onglet.fields);
    const fV = fields.reduce(
        (acc, curr) => ({
            ...acc,
            ...arrayToObject(queryParams)(buildMustacheParams)(curr as any),
        }),
        {},
    );
    const iFV = fields.reduce(
        (acc, curr) => ({
            ...acc,
            ...arrayToObject({})(buildMustacheParams)(curr as any),
        }),
        {},
    );
    return { fV, iFV, oF };
};

export const getService = async (idCatalogue: string, idService: string) =>
    (await prAxiosInstance)(`${restApiPaths.catalogue}/${idCatalogue}/${idService}`).then(
        ({ data }) => data,
    );
