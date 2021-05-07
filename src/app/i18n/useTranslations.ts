
import type { Scheme, I18nSchemes, Translations } from "./resources";
import * as reactI18next from 'react-i18next';
import { id } from "tsafe/id";

type NoParamsKeys<S extends Scheme> = NonNullable<{
    [K in keyof S]: S[K] extends undefined ? K : never;
}[keyof S]>;

export type TFunction<S extends Scheme> = {
    (key: NoParamsKeys<S>): string;
    <T extends Exclude<keyof S, NoParamsKeys<S>>>(key: T, params: S[T]): string;
};

export const useTranslation = id<
    { <K extends keyof Translations>(ns: K): { t: TFunction<I18nSchemes[K]>; } }
>(reactI18next.useTranslation)

