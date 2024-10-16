const isExactMatch = (key: string, resourceKey: string): boolean => {
    return key === resourceKey;
};

const isWildcardMatch = (key: string, resourceKey: string): boolean => {
    const parts = resourceKey.split("*");

    // Ensure the key starts with the part before the wildcard and ends with the part after
    return key.startsWith(parts[0]) && (parts.length === 1 || key.endsWith(parts[1]));
};

const isDirectoryMatch = (key: string, resourceKey: string): boolean => {
    return resourceKey.endsWith("/") && key.startsWith(resourceKey);
};

export const checkIfS3KeyIsPublic = (allowedResources: string[], key: string): boolean =>
    allowedResources.some((resourceKey: string) => {
        if (resourceKey.includes("*")) {
            return isWildcardMatch(key, resourceKey);
        }

        if (resourceKey.endsWith("/")) {
            return isDirectoryMatch(key, resourceKey);
        }

        return isExactMatch(key, resourceKey);
    });
