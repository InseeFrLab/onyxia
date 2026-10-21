/**
 * The user's explicit choice, when it is still a configured provider (connected or not).
 * Otherwise, the first connected provider in the order of the configuration.
 * undefined: no choice and nothing connected.
 */
export function getFavoriteProviderId(params: {
    providerIds: string[];
    connectedProviderIds: string[];
    favoriteProviderId_persisted: string | null;
}): string | undefined {
    const { providerIds, connectedProviderIds, favoriteProviderId_persisted } = params;

    if (
        favoriteProviderId_persisted !== null &&
        providerIds.includes(favoriteProviderId_persisted)
    ) {
        return favoriteProviderId_persisted;
    }

    return providerIds.find(providerId => connectedProviderIds.includes(providerId));
}
