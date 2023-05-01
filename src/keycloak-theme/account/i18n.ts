import { createUseI18n } from "keycloakify/account";

//NOTE: See src/login/i18n.ts for instructions on customization of i18n messages.
export const { useI18n } = createUseI18n({});

export type I18n = NonNullable<ReturnType<typeof useI18n>>;
